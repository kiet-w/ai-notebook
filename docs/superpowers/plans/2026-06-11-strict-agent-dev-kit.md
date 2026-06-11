# Strict Agent Dev Kit Integration Implementation Plan (Simplified)

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Integrate the Memory (L1) and Knowledge/Skills (L2) layers of the Agent Dev Kit structure to strictly enforce coding guidelines and quality checks without local git hook overhead or subagent delegation.

**Architecture:** Create root-level rules files (CLAUDE.md & GEMINI.md) as the memory layer, and a custom skill (skills/strict-lint) as the knowledge layer for manual quality checks.

**Tech Stack:** Next.js, NestJS, ESLint, TypeScript.

---

### Task 1: Layer 1 - Memory Layer (CLAUDE.md & GEMINI.md)

**Files:**
- Create: `/home/baudui/Downloads/project/brain/CLAUDE.md`
- Create: `/home/baudui/Downloads/project/brain/GEMINI.md`

- [ ] **Step 1: Create the root CLAUDE.md file**

Create the file `/home/baudui/Downloads/project/brain/CLAUDE.md` with the following contents:
```markdown
# Agent Memory Layer (L1)

## Behavioral Guidelines
- Always prioritize structural integrity and follow strict coding styles.
- When performing backend tasks, check NestJS coding rules in backend/GEMINI.md.
- When performing frontend tasks, check Next.js App Router rules in frontend/GEMINI.md.
- Run tests and linting before declaring a task complete.

## Branch and Commit Conventions
- Branch naming: `feat/<name>`, `fix/<name>`, or `refactor/<name>`.
- Commit messages: Follow Conventional Commits format (e.g. `feat: add notes pagination`, `fix: handle cors headers`).
```

- [ ] **Step 2: Create the root GEMINI.md rules file**

Create the file `/home/baudui/Downloads/project/brain/GEMINI.md` with the following contents:
```markdown
# Strict Project Guardrails (GEMINI.md)

## Core Enforcements:
1. **Zero Warnings/Errors Policy:** No code changes will be accepted if they introduce any TypeScript compiler warning/error or ESLint issue.
2. **Atomic Design Strictness:** All UI components in the frontend MUST reside in appropriate subfolders inside `frontend/src/components/` (`atoms/`, `molecules/`, `organisms/`, `templates/`). No flat structure is permitted.
3. **Data Verification:** All backend endpoints MUST use DTOs with strict `class-validator` annotations for input validation.
4. **Validation Routine:** Before submitting tasks, run the strict-lint skill checklist to verify the build is clean.
```

- [ ] **Step 3: Verify files are created and contain the correct content**

Run: `cat /home/baudui/Downloads/project/brain/CLAUDE.md /home/baudui/Downloads/project/brain/GEMINI.md`
Expected: Outputs both files with correct content.

- [ ] **Step 4: Commit Layer 1 rules**

Run:
```bash
git add /home/baudui/Downloads/project/brain/CLAUDE.md /home/baudui/Downloads/project/brain/GEMINI.md
git commit -m "chore: setup memory layer L1 with CLAUDE.md and GEMINI.md"
```

---

### Task 2: Layer 2 - Knowledge Layer (Skills)

**Files:**
- Create: `/home/baudui/Downloads/project/brain/skills/strict-lint/SKILL.md`

- [ ] **Step 1: Create the custom strict-lint skill**

Create the file `/home/baudui/Downloads/project/brain/skills/strict-lint/SKILL.md` with the following contents:
```markdown
# strict-lint Skill

Use this skill when preparing to commit any code changes or finalize work on a task. It ensures the workspace meets the strict quality rules of the Agent Dev Kit.

## Workflow

1. **Verify Formatting & Linting:**
   Check both frontend and backend for linting errors:
   - Frontend: `npm run lint` (run inside `frontend/` directory)
   - Backend: `npm run lint` (run inside `backend/` directory)

2. **Verify Compilation:**
   Ensure everything compiles without errors:
   - Frontend: `npx tsc --noEmit` (run inside `frontend/` directory)
   - Backend: `npm run build` (run inside `backend/` directory)
   
3. **Handle Errors:**
   - If frontend lint fails, fix ESLint issues before proceeding.
   - If backend build fails, resolve all TypeScript compilation and NestJS module dependency errors.
```

- [ ] **Step 2: Commit the new skill**

Run:
```bash
git add /home/baudui/Downloads/project/brain/skills/strict-lint/SKILL.md
git commit -m "chore: setup knowledge layer L2 with strict-lint skill"
```
