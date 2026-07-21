# 漢字の道 — Japanese Quiz App

A Japanese vocabulary and kanji study app with AI-powered practice modes.

## Stack

- **Frontend**: React + Vite + Tailwind CSS (`artifacts/japanese-quiz`)
- **API Server**: Express + TypeScript (`artifacts/api-server`)
- **Database**: MongoDB (via Mongoose)
- **AI**: Gemini / Groq / OpenRouter APIs for sentence feedback

## Running the app

Two workflows run in parallel:

| Workflow | Command |
|---|---|
| `artifacts/japanese-quiz: web` | `pnpm --filter @workspace/japanese-quiz run dev` |
| `artifacts/api-server: API Server` | `pnpm --filter @workspace/api-server run dev` |

Install dependencies first (if missing):
```bash
pnpm install
```

## Required secrets

| Secret | Description |
|---|---|
| `MONGODB_URI` | MongoDB connection string |
| `GEMINI_API_KEY` | Google Gemini API key (AI sentence feedback) |
| `GROQ_API_KEY` | Groq API key (AI fallback) |
| `OPENROUTER_API_KEY` | OpenRouter API key (AI fallback) |

## Project structure

```
artifacts/
  japanese-quiz/   # React frontend
  api-server/      # Express REST API
lib/
  api-client-react/  # Generated React Query hooks
  api-spec/          # OpenAPI spec + Orval config
  api-zod/           # Zod schemas for API types
  db/                # Drizzle ORM (PostgreSQL — currently unused by API server)
```

## User preferences
