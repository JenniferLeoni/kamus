# 漢字の道 — Japanese Quiz App

A Japanese vocabulary and kanji study app with AI-powered practice modes.

## Stack

- **Frontend**: React + Vite + Tailwind CSS (`artifacts/japanese-quiz`)
- **API Server**: Express + TypeScript (`artifacts/api-server`)
- **Database**: MongoDB (via Mongoose)
- **AI**: Gemini / Groq / OpenRouter APIs for sentence feedback

## Deployment (Netlify)

The app is deployed entirely on Netlify — no separate API server needed.

- The React frontend is built by Vite and served as static files.
- The Express API server runs as a **Netlify serverless function** (`netlify/functions/api.ts`),
  which wraps the existing `app.ts` via `serverless-http`.
- `/api/*` requests are redirected to the function automatically (`netlify.toml`).

### Required environment variables in Netlify

| Variable | Description |
|---|---|
| `MONGODB_URI` | MongoDB Atlas connection string |
| `GEMINI_API_KEY` | Google Gemini API key (AI sentence feedback) |
| `GROQ_API_KEY` | Groq API key (AI fallback) |
| `OPENROUTER_API_KEY` | OpenRouter API key (AI fallback) |
| `VITE_APP_PASSWORD` | Optional password gate for the frontend |

> **MongoDB Atlas**: make sure `0.0.0.0/0` is in your Atlas Network Access list so
> the serverless function (dynamic IPs) can connect.

## Running locally on Replit

Two workflows run in parallel:

| Workflow | Command |
|---|---|
| `artifacts/japanese-quiz: web` | `pnpm --filter @workspace/japanese-quiz run dev` |
| `artifacts/api-server: API Server` | `pnpm --filter @workspace/api-server run dev` |

Install dependencies first (if missing):
```bash
pnpm install
```

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
