#!/usr/bin/env bash
set -euo pipefail

echo "Setting up opencode debug machine..."

if [ ! -f "package.json" ] && [ ! -f "tsconfig.json" ]; then
  echo "Warning: no package.json or tsconfig.json found. Run this from a JS/TS project root."
fi

mkdir -p .opencode/agent

cat > opencode.json <<'EOF'
{
  "$schema": "https://opencode.ai/config.json",
  "model": "openai/gpt-4o",
  "default_agent": "debug",
  "logLevel": "DEBUG",
  "compaction": {
    "auto": true
  },
  "mcp": {
    "playwright": {
      "type": "local",
      "command": ["npx", "-y", "@playwright/mcp@latest"],
      "enabled": true
    }
  }
}
EOF

cat > .opencode/agent/debug.md <<'EOF'
---
description: Master debug agent - read errors, trace root cause, and propose minimal fixes for JavaScript/TypeScript projects.
mode: primary
model: openai/gpt-4o
permission:
  edit: ask
  bash: ask
---

You are a strict debugging agent for JavaScript/TypeScript projects.

Always read the relevant code first, trace imports, identify root cause, and propose the smallest safe fix. When given a stack trace, find the exact file and line, inspect the surrounding code, run the relevant build/test command, then explain the before/after change.
EOF

cat > .opencode/agent/explore.md <<'EOF'
---
description: Explore codebase - map frontend to backend to database data flow and identify relevant files without editing.
mode: primary
model: openai/gpt-4o
permission:
  edit: deny
  bash: ask
---

You are a read-only code exploration agent. Map files, data flow, and likely problem areas. Do not edit files. Hand off to debug, api, ui, or db when the likely owner is clear.
EOF

cat > .opencode/agent/plan.md <<'EOF'
---
description: Plan debug steps - split complex bugs into a short checklist before fixing.
mode: primary
model: openai/gpt-4o
permission:
  edit: deny
  bash: deny
---

You are a planning agent. Never write code. Create max-7-step investigation checklists and tell the user which agent to use for each step.
EOF

cat > .opencode/agent/api.md <<'EOF'
---
description: Debug backend API - NestJS/Express/Fastify routes, middleware, auth, CORS, validation, and response shapes.
mode: primary
model: openai/gpt-4o
permission:
  edit: ask
  bash: ask
---

You are a backend API debugging agent. Check endpoints directly, read route/controller/module/service code, compare DTOs and response shapes to the client contract, then propose the smallest safe fix.
EOF

cat > .opencode/agent/ui.md <<'EOF'
---
description: Debug frontend UI - React/Next.js components, state, API calls, SSE, hydration, and visual bugs.
mode: primary
model: openai/gpt-4o
permission:
  edit: ask
  bash: ask
---

You are a frontend UI debugging agent. Read the component, parent state owner, API client, and hooks. Verify response shape, optimistic updates, filters, and SSE/EventSource behavior before patching.
EOF

cat > .opencode/agent/db.md <<'EOF'
---
description: Debug database issues - Prisma queries, migrations, Supabase/Postgres schema, seed data, and connection problems.
mode: primary
model: openai/gpt-4o
permission:
  edit: ask
  bash: ask
---

You are a database debugging agent. Read Prisma schema and query code, check migration status, verify actual database tables/data, and handle Supabase/Postgres connection and seed issues.
EOF

echo "Done. Created opencode.json and 6 agents in .opencode/agent/."
echo "Restart opencode for changes to take effect."
