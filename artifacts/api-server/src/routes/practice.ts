import { Router } from "express";
import { Vocab } from "../models/vocab";
import { Kanji } from "../models/kanji";
import {
  GetMultipleChoiceQuestionsQueryParams,
  CheckSentenceBody,
  GetSentenceWordsQueryParams,
} from "@workspace/api-zod";
import { logger } from "../lib/logger";
import { checkSentenceWithFallback } from "../lib/ai-fallback";

const router = Router();

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j]!, a[i]!];
  }
  return a;
}

// GET /api/practice/multiple-choice
router.get("/multiple-choice", async (req, res) => {
  const parsed = GetMultipleChoiceQuestionsQueryParams.safeParse(req.query);
  if (!parsed.success) {
    res.status(400).json({ error: "Invalid query params" });
    return;
  }
  const { quizType, section, chapter, level, count = 10 } = parsed.data;
  const filter: Record<string, unknown> = {};
  if (section !== undefined) filter["section"] = section;
  if (chapter !== undefined) filter["chapter"] = chapter;
  if (level !== undefined) filter["level"] = level;

  if (quizType === "vocab") {
    const pool = await Vocab.find(filter);
    if (pool.length < 4) {
      res.status(400).json({ error: "Not enough vocabulary entries (need at least 4)" });
      return;
    }
    const selected = shuffle(pool).slice(0, Math.min(count, pool.length));
    const questions = selected.map((item) => {
      // Pick 3 wrong answers from pool
      const wrong = shuffle(pool.filter((p) => p._id.toString() !== item._id.toString()))
        .slice(0, 3)
        .map((p) => p.meaning);
      const correct = item.meaning;
      const options = shuffle([correct, ...wrong]);
      const correctIndex = options.indexOf(correct);
      return {
        id: item._id.toString(),
        questionType: "vocab" as const,
        prompt: item.word,
        promptReading: item.reading ?? null,
        options,
        correctIndex,
        vocab: {
          id: item._id.toString(),
          word: item.word,
          reading: item.reading,
          romaji: item.romaji ?? undefined,
          meaning: item.meaning,
          type: item.type,
          level: item.level,
          section: item.section,
          chapter: item.chapter,
          example_sentences: item.example_sentences,
          grammar_examples: item.grammar_examples,
        },
        kanji: null as unknown as ReturnType<typeof Object>,
      };
    });
    res.json(questions);
  } else {
    // kanji
    const pool = await Kanji.find(filter);
    if (pool.length < 4) {
      res.status(400).json({ error: "Not enough kanji entries (need at least 4)" });
      return;
    }
    const selected = shuffle(pool).slice(0, Math.min(count, pool.length));
    const questions = selected.map((item) => {
      const wrong = shuffle(pool.filter((p) => p._id.toString() !== item._id.toString()))
        .slice(0, 3)
        .map((p) => p.meanings[0] ?? "");
      const correct = item.meanings[0] ?? "";
      const options = shuffle([correct, ...wrong]);
      const correctIndex = options.indexOf(correct);
      return {
        id: item._id.toString(),
        questionType: "kanji" as const,
        prompt: item.character,
        promptReading: item.on_readings[0] ?? null,
        options,
        correctIndex,
        vocab: null as unknown as ReturnType<typeof Object>,
        kanji: {
          id: item._id.toString(),
          character: item.character,
          on_readings: item.on_readings,
          kun_readings: item.kun_readings,
          meanings: item.meanings,
          strokes: item.strokes ?? null,
          level: item.level,
          section: item.section,
          chapter: item.chapter,
          examples: item.examples,
        },
      };
    });
    res.json(questions);
  }
});

// POST /api/practice/sentence-check
router.post("/sentence-check", async (req, res) => {
  const parsed = CheckSentenceBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: "Invalid request body" });
    return;
  }
  const { word, reading, meaning, sentence } = parsed.data;

  try {
    const { result, provider } = await checkSentenceWithFallback(word, reading, meaning, sentence);
    res.json({ ...result, _provider: provider });
  } catch (err: any) {
    logger.error({ err }, "All AI providers failed");
    res.status(503).json({ error: "All AI providers are currently unavailable. Please try again later." });
  }
});

// GET /api/practice/sentence-words
router.get("/sentence-words", async (req, res) => {
  const parsed = GetSentenceWordsQueryParams.safeParse(req.query);
  if (!parsed.success) {
    res.status(400).json({ error: "Invalid query params" });
    return;
  }
  const { section, chapter, level, count = 5 } = parsed.data;
  const filter: Record<string, unknown> = {};
  if (section !== undefined) filter["section"] = section;
  if (chapter !== undefined) filter["chapter"] = chapter;
  if (level !== undefined) filter["level"] = level;

  const pool = await Vocab.find(filter);
  const selected = shuffle(pool).slice(0, Math.min(count, pool.length));
  res.json(
    selected.map((d) => ({
      id: d._id.toString(),
      word: d.word,
      reading: d.reading,
      romaji: d.romaji ?? undefined,
      meaning: d.meaning,
      type: d.type,
      level: d.level,
      section: d.section,
      chapter: d.chapter,
      example_sentences: d.example_sentences,
      grammar_examples: d.grammar_examples,
    })),
  );
});

export default router;
