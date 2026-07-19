# Build Errors Log

## Backend Errors

1. **TypeScript Compiler Warning**
   - **Error**: `Option 'baseUrl' is deprecated and will stop functioning in TypeScript 7.0.`
   - **File**: `backend/tsconfig.json`
   - **Fix**: This is a deprecation warning from TypeScript. It doesn't break the build but was recorded during `npm run build` inside the backend.
2. **Prisma groupBy Error** (Fixed earlier)
   - **Error**: `Invalid this.prisma.note.groupBy() invocation`
   - **File**: `backend/src/notes/repositories/notes.repository.ts`
   - **Fix**: Replaced `_count: { id: true }` with `_count: { _all: true }`.

## Frontend Errors

1. **TypeScript Type Error**
   - **Error**: `Type error: Element implicitly has an 'any' type because expression of type 'Category' can't be used to index type '{}'.`
   - **File**: `frontend/src/components/templates/HomeTemplate.tsx` (Line 168)
   - **Context**: The `unreadCounts` object returned from `useQuery` defaulted to `{}` without proper typing, causing a TypeScript error when indexing with a `Category` enum key.
   - **Fix**: Added proper type casting to the default value: `const { data: unreadCounts = {} as Record<Category, number> } = useQuery(...)`.

**Status**: Both backend and frontend have been fixed. Running `npm run build` in both directories now completes successfully with 0 errors.
