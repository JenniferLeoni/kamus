/**
 * Serverless-safe Express app — identical to app.ts but without pino-http.
 * pino-http uses worker threads that crash when bundled by Netlify's esbuild
 * without esbuild-plugin-pino, so we skip it in the serverless context.
 */
import express, { type Express } from "express";
import cors from "cors";
import router from "./routes";

const app: Express = express();

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use("/api", router);

export default app;
