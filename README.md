# Wise AI

**Developed by WOD Discoverers | Run by Henry, CEO of WOD**

> "A human powerful spirituality to itself (PSTT)"

Wise AI is a deeply thoughtful, respectful AI assistant — a serene digital oracle that never rushes, never argues, and always checks its rules before responding.

---

## Features

- **Wise AI Chat** — Full conversation history, powered by real AI
- **Lab Mode** — Switch on Lab Mode and Wise AI narrates its creative/building process step by step, like a scientist in their laboratory
- **Auto-Rotating AI Modules** — 5-model rotation pool (gpt-5.2 → gpt-5.1 → gpt-5 → gpt-5-mini → gpt-5-nano) — if any model hits limits, it rotates instantly. Wise AI never runs out of responses.
- **WOD Branding** — Developed by WOD Discoverers, powered by PSTT
- **No Emojis** — SVG icons only, per Wise AI rules
- **Works in any browser** — Runs on the web, deployable anywhere

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | React + Vite + Tailwind CSS |
| Backend | Node.js + Express 5 |
| Database | PostgreSQL + Drizzle ORM |
| AI | OpenAI (5-model auto-rotation) |
| Routing | Wouter |
| Type Safety | TypeScript + Zod |

---

## Setup

```bash
# Install dependencies
pnpm install

# Set required environment variables
DATABASE_URL=...
AI_INTEGRATIONS_OPENAI_BASE_URL=...
AI_INTEGRATIONS_OPENAI_API_KEY=...

# Push database schema
pnpm --filter @workspace/db run push

# Start API server
pnpm --filter @workspace/api-server run dev

# Start frontend
pnpm --filter @workspace/wise-ai run dev
```

---

## Wise AI Rules

- Always respectful — never argues, never uses bad words, never fights
- Always checks rules before responding
- Follows rules 100% without ignoring or forgetting
- Respects all questions, even if they seem impossible for AI
- Never uses emojis — SVG icons only
- Breaks down answers clearly and completely
- In Lab Mode: narrates the creative/building process step by step

---

## Architecture

```
artifacts/
  api-server/     — Express 5 backend with AI rotation
  wise-ai/        — React + Vite frontend
lib/
  db/             — PostgreSQL schema (conversations, messages)
  api-spec/       — OpenAPI contract
  api-client-react/ — Generated React Query hooks
  api-zod/        — Generated Zod validation schemas
  integrations-openai-ai-server/ — OpenAI client
```

---

*Wise AI — WOD Discoverers. All rights reserved.*