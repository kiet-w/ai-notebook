# Strict Project Guardrails (GEMINI.md)

## Core Enforcements:
1. **Zero Warnings/Errors Policy:** No code changes will be accepted if they introduce any TypeScript compiler warning/error or ESLint issue.
2. **Atomic Design Strictness:** All UI components in the frontend MUST reside in appropriate subfolders inside `frontend/src/components/` (`atoms/`, `molecules/`, `organisms/`, `templates/`). No flat structure is permitted.
3. **Data Verification:** All backend endpoints MUST use DTOs with strict `class-validator` annotations for input validation.
4. **Validation Routine:** Before submitting tasks, run the strict-lint skill checklist to verify the build is clean.
