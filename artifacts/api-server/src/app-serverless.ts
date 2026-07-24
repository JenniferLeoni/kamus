/**
 * Serverless-safe Express app — identical to app.ts but without pino-http.
 * pino-http uses worker threads that crash when bundled by Netlify's esbuild
 * without esbuild-plugin-pino, so we skip it in the serverless context.
 */
import express, { type Express, type Request, type Response, type NextFunction } from "express";
import cors from "cors";
import router from "./routes";

const app: Express = express();

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use("/api", router);

// JSON error handler — replaces Express's default HTML error page so
// the client always gets a machine-readable response.
// eslint-disable-next-line @typescript-eslint/no-unused-vars
app.use((err: unknown, _req: Request, res: Response, _next: NextFunction) => {
  const message = err instanceof Error ? err.message : String(err);
  const stack = err instanceof Error ? err.stack : undefined;
  res.status(500).json({ error: "Internal server error", detail: message, stack });
});

export default app;
