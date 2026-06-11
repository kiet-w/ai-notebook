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
