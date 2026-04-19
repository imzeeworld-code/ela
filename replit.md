# Workspace

## Overview

pnpm workspace monorepo using TypeScript. This project is a full-stack implementation of **Wise AI** — a thoughtful, respectful AI assistant developed by WOD (WOD Discoverers), run by Henry (CEO).

## Stack

- **Monorepo tool**: pnpm workspaces
- **Node.js version**: 24
- **Package manager**: pnpm
- **TypeScript version**: 5.9
- **Frontend**: React + Vite (`artifacts/wise-ai`)
- **API framework**: Express 5 (`artifacts/api-server`)
- **Database**: PostgreSQL + Drizzle ORM
- **Validation**: Zod (`zod/v4`), `drizzle-zod`
- **API codegen**: Orval (from OpenAPI spec)
- **Build**: esbuild (CJS bundle)
- **AI**: OpenAI via Replit AI Integrations (`@workspace/integrations-openai-ai-server`)
- **Routing**: wouter

## Wise AI Features

- **Chat interface**: Full conversation management with history
- **Lab Mode**: Wise AI narrates its process when building/creating
- **WOD branding**: Developed by WOD Discoverers, run by Henry (CEO)
- **Personality**: Respectful, wise, never uses emojis, always checks rules
- **PSTT**: "Human powerful spirituality to itself"

## Key Commands

- `pnpm run typecheck` — full typecheck across all packages
- `pnpm run build` — typecheck + build all packages
- `pnpm --filter @workspace/api-spec run codegen` — regenerate API hooks and Zod schemas from OpenAPI spec
- `pnpm --filter @workspace/db run push` — push DB schema changes (dev only)
- `pnpm --filter @workspace/api-server run dev` — run API server locally

## Database Schema

- `conversations` — conversation sessions (id, title, createdAt, updatedAt)
- `messages` — chat messages (id, conversationId, role, content, mode, createdAt)

## API Endpoints

- `GET /api/conversations` — list all conversations
- `POST /api/conversations` — create conversation
- `GET /api/conversations/stats` — stats (totals, recent)
- `GET /api/conversations/:id` — get conversation
- `DELETE /api/conversations/:id` — delete conversation
- `GET /api/conversations/:id/messages` — list messages
- `POST /api/conversations/:id/messages` — send message + get AI response

See the `pnpm-workspace` skill for workspace structure, TypeScript setup, and package details.
