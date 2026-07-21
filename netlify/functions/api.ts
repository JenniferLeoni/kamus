import type { HandlerEvent, HandlerContext, HandlerResponse } from "@netlify/functions";
import serverless from "serverless-http";
import app from "../../artifacts/api-server/src/app";
import { connectMongo } from "../../artifacts/api-server/src/lib/mongodb";

// Wrap the existing Express app as a Netlify serverless function.
// connectMongo() is guarded by an isConnected flag, so it is a no-op on
// warm invocations — this keeps the MongoDB connection alive across requests
// and avoids exhausting Atlas free-tier connection limits.
const serverlessApp = serverless(app);

export async function handler(
  event: HandlerEvent,
  context: HandlerContext,
): Promise<HandlerResponse> {
  await connectMongo();
  return serverlessApp(event, context) as Promise<HandlerResponse>;
}
