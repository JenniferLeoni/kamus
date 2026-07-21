import app from "./app";
import { logger } from "./lib/logger";
import { connectMongo } from "./lib/mongodb";

const rawPort = process.env["PORT"];

if (!rawPort) {
  throw new Error(
    "PORT environment variable is required but was not provided.",
  );
}

const port = Number(rawPort);

if (Number.isNaN(port) || port <= 0) {
  throw new Error(`Invalid PORT value: "${rawPort}"`);
}

async function main() {
  // Start listening first so startup health checks pass immediately,
  // then connect to MongoDB. Requests that hit DB-backed routes before
  // the connection is ready will fail gracefully via Mongoose's own errors.
  await new Promise<void>((resolve, reject) => {
    app.listen(port, (err) => {
      if (err) {
        logger.error({ err }, "Error listening on port");
        reject(err);
        return;
      }
      logger.info({ port }, "Server listening");
      resolve();
    });
  });

  await connectMongo();
}

main().catch((err) => {
  logger.error({ err }, "Fatal startup error");
  process.exit(1);
});
