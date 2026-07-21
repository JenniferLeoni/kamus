import OpenAI from "openai";
import { logger } from "./logger";

export interface SentenceCheckResult {
  isCorrect: boolean;
  score: number;
  feedback: string;
  corrections: string | null;
  alternativeExamples: Array<{ japanese: string; romaji: string; english: string }>;
}

interface Provider {
  name: string;
  client: OpenAI;
  model: string;
}

function buildProviders(): Provider[] {
  const providers: Provider[] = [];

  if (process.env["GEMINI_API_KEY"]) {
    providers.push({
      name: "Gemini",
      client: new OpenAI({
        apiKey: process.env["GEMINI_API_KEY"],
        baseURL: "https://generativelanguage.googleapis.com/v1beta/openai/",
      }),
      model: "gemini-2.0-flash",
    });
  }

  if (process.env["GROQ_API_KEY"]) {
    providers.push({
      name: "Groq",
      client: new OpenAI({
        apiKey: process.env["GROQ_API_KEY"],
        baseURL: "https://api.groq.com/openai/v1",
      }),
      model: "llama-3.3-70b-versatile",
    });
  }

  if (process.env["OPENROUTER_API_KEY"]) {
    providers.push({
      name: "OpenRouter",
      client: new OpenAI({
        apiKey: process.env["OPENROUTER_API_KEY"],
        baseURL: "https://openrouter.ai/api/v1",
        defaultHeaders: {
          "HTTP-Referer": "https://japanese-quiz.replit.app",
          "X-Title": "Japanese Quiz",
        },
      }),
      model: "meta-llama/llama-3.1-8b-instruct:free",
    });
  }

  return providers;
}

function isRetriableError(err: any): boolean {
  // Retry on quota/rate-limit (429) and server errors (5xx)
  const status = err?.status ?? err?.response?.status;
  return status === 429 || (status >= 500 && status < 600);
}

export async function checkSentenceWithFallback(
  word: string,
  reading: string,
  meaning: string,
  sentence: string
): Promise<{ result: SentenceCheckResult; provider: string }> {
  const providers = buildProviders();

  if (providers.length === 0) {
    throw new Error("No AI providers configured. Set GEMINI_API_KEY, GROQ_API_KEY, or OPENROUTER_API_KEY.");
  }

  const prompt = `You are a Japanese language teacher evaluating a student's sentence.

Word given: ${word} (${reading}) — meaning: ${meaning}
Student's sentence: ${sentence}

Evaluate the sentence. Respond ONLY with a JSON object (no markdown, no code blocks) with this exact structure:
{
  "isCorrect": boolean,
  "score": number (0-100),
  "feedback": "concise feedback in English",
  "corrections": "corrected sentence if needed, or null if perfect",
  "alternativeExamples": [
    { "japanese": "...", "romaji": "...", "english": "..." },
    { "japanese": "...", "romaji": "...", "english": "..." },
    { "japanese": "...", "romaji": "...", "english": "..." }
  ]
}

Rules:
- alternativeExamples must use different grammar patterns (e.g. -tai, -nai, -te kudasai, -koto ga dekiru, -nagara, etc.)
- Be encouraging but accurate
- Score 0-100: 90+ for perfect, 70-89 for minor errors, 50-69 for understandable but wrong, below 50 for major issues`;

  const errors: Array<{ provider: string; message: string }> = [];

  for (const provider of providers) {
    try {
      logger.info({ provider: provider.name }, "Trying AI provider");

      const completion = await provider.client.chat.completions.create({
        model: provider.model,
        messages: [{ role: "user", content: prompt }],
        temperature: 0.7,
      });

      const text = completion.choices[0]?.message?.content?.trim() ?? "";

      let parsed: SentenceCheckResult;
      try {
        parsed = JSON.parse(text);
      } catch {
        const match = text.match(/\{[\s\S]*\}/);
        if (!match) throw new Error("Could not parse AI response as JSON");
        parsed = JSON.parse(match[0]);
      }

      logger.info({ provider: provider.name }, "AI provider succeeded");
      return { result: parsed, provider: provider.name };
    } catch (err: any) {
      const message = err?.message ?? String(err);
      logger.warn({ provider: provider.name, err }, "AI provider failed");
      errors.push({ provider: provider.name, message });

      // Only try next provider if this was a retriable error
      if (!isRetriableError(err)) {
        break;
      }
    }
  }

  const summary = errors.map((e) => `${e.provider}: ${e.message}`).join(" | ");
  throw Object.assign(new Error(`All AI providers failed. ${summary}`), { allFailed: true, errors });
}
