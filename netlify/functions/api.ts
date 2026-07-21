import type { HandlerEvent, HandlerContext, HandlerResponse } from "@netlify/functions";

// All imports are lazy so any module-initialization crash is caught
// by the try/catch below and returned as a readable 500 instead of a
// silent 502.
export async function handler(
  event: HandlerEvent,
  context: HandlerContext,
): Promise<HandlerResponse> {
  try {
    const [{ default: serverless }, { default: app }, { connectMongo }] =
      await Promise.all([
        import("serverless-http"),
        import("../../artifacts/api-server/src/app-serverless"),
        import("../../artifacts/api-server/src/lib/mongodb"),
      ]);

    await connectMongo();
    return (await serverless(app)(event, context)) as HandlerResponse;
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    const stack = err instanceof Error ? err.stack : undefined;
    return {
      statusCode: 500,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ error: "Server error", detail: message, stack }),
    };
  }
}
