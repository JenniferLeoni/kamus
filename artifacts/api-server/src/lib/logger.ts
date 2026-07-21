import pino from "pino";

// Always use plain JSON output — works in both local and serverless (Netlify) environments.
// For pretty-printed logs locally, pipe output through pino-pretty:
//   pnpm --filter @workspace/api-server run dev | pnpm pino-pretty
export const logger = pino({
  level: process.env.LOG_LEVEL ?? "info",
  redact: [
    "req.headers.authorization",
    "req.headers.cookie",
    "res.headers['set-cookie']",
  ],
});
