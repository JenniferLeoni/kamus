# Japanese Quiz — 漢字の道

A Japanese vocabulary and kanji quiz web app with manual entry management, multiple choice practice, and AI-powered sentence creation practice.

## Run & Operate

- `pnpm --filter @workspace/api-server run dev` — run the API server (port 8080)
- `pnpm --filter @workspace/japanese-quiz run dev` — run the frontend (port assigned by Replit)
- `pnpm run typecheck` — full typecheck across all packages
- `pnpm --filter @workspace/api-spec run codegen` — regenerate API hooks and Zod schemas from the OpenAPI spec
- `pnpm --filter @workspace/api-server exec tsx src/seed.ts` — re-seed mock vocab/kanji data (skips if already present)

## Required Secrets

- `MONGODB_URI` — MongoDB Atlas connection string (`mongodb+srv://...`)
- `GEMINI_API_KEY` — Google AI Studio API key for sentence checking

## Stack

- pnpm workspaces, Node.js 24, TypeScript 5.9
- Frontend: React + Vite + Wouter + TanStack Query + shadcn/ui
- Backend: Express 5 + Mongoose (MongoDB)
- AI: Google Gemini 2.0 Flash (sentence grading)
- API codegen: Orval (from OpenAPI spec)

## Where things live

- `artifacts/japanese-quiz/src/` — React frontend (pages, components)
- `artifacts/api-server/src/routes/` — Express route handlers
- `artifacts/api-server/src/models/` — Mongoose models (Vocab, Kanji)
- `artifacts/api-server/src/lib/mongodb.ts` — MongoDB connection singleton
- `artifacts/api-server/src/seed.ts` — mock data seeder
- `lib/api-spec/openapi.yaml` — OpenAPI spec (source of truth)
- `lib/api-client-react/src/generated/` — generated React Query hooks
- `lib/api-zod/src/generated/` — generated Zod validation schemas

## Data Model

### Vocab
word, reading, romaji, meaning, type (noun/verb/adj/adv/particle/expression/other), level (N5–N1), section (int), chapter (int), example_sentences [{japanese, romaji, english}], grammar_examples [{grammar, sentence, romaji, english}]

### Kanji
character, on_readings[], kun_readings[], meanings[], strokes, level, section, chapter, examples [{word, reading, meaning}]

## Features

- **Browse** — filterable table (section, chapter, level, search); expandable row detail
- **Add/Edit** — manual entry form for vocab and kanji with dynamic example sentence and grammar example lists
- **Multiple Choice** — configurable quiz (type, level, section, chapter, count); reveals full entry detail after each answer
- **Sentence Creation** — word shown, user writes a sentence; Gemini grades it (correct/score/feedback/corrections) and suggests 3 alternative grammar examples

## Architecture decisions

- MongoDB chosen over Replit PostgreSQL (user requirement for external DB)
- Gemini 2.0 Flash used for sentence evaluation — returns structured JSON directly
- OpenAPI-first: all API contracts defined in `lib/api-spec/openapi.yaml`, codegen produces hooks and Zod schemas
- Seed script is idempotent (skips if data already exists)

## User preferences

_Populate as you build._

## Gotchas

- After any OpenAPI spec change, run `pnpm --filter @workspace/api-spec run codegen` before editing routes or frontend
- The Kanji model has a unique index on `character` — use upsert when seeding
- Mongoose `findOneAndUpdate` with `new: true` shows a deprecation warning; use `returnDocument: 'after'` in future
