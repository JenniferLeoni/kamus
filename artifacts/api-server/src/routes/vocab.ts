import { Router } from "express";
import { Vocab } from "../models/vocab";
import {
  ListVocabQueryParams,
  CreateVocabBody,
  UpdateVocabBody,
} from "@workspace/api-zod";

const router = Router();

// GET /api/vocab
router.get("/", async (req, res) => {
  const parsed = ListVocabQueryParams.safeParse(req.query);
  if (!parsed.success) {
    res.status(400).json({ error: "Invalid query params" });
    return;
  }
  const { section, chapter, level, type, search } = parsed.data;

  const filter: Record<string, unknown> = {};
  if (section !== undefined) filter["section"] = section;
  if (chapter !== undefined) filter["chapter"] = chapter;
  if (level !== undefined) filter["level"] = level;
  if (type !== undefined) filter["type"] = type;
  if (search) {
    filter["$or"] = [
      { word: { $regex: search, $options: "i" } },
      { reading: { $regex: search, $options: "i" } },
      { romaji: { $regex: search, $options: "i" } },
      { meaning: { $regex: search, $options: "i" } },
    ];
  }

  const docs = await Vocab.find(filter).sort({ section: 1, chapter: 1, word: 1 });
  const result = docs.map((d) => ({
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
  }));
  res.json(result);
});

// POST /api/vocab
router.post("/", async (req, res) => {
  const parsed = CreateVocabBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }
  const doc = await Vocab.create(parsed.data);
  res.status(201).json({
    id: doc._id.toString(),
    word: doc.word,
    reading: doc.reading,
    romaji: doc.romaji ?? undefined,
    meaning: doc.meaning,
    type: doc.type,
    level: doc.level,
    section: doc.section,
    chapter: doc.chapter,
    example_sentences: doc.example_sentences,
    grammar_examples: doc.grammar_examples,
  });
});

// GET /api/vocab/:id
router.get("/:id", async (req, res) => {
  const doc = await Vocab.findById(req.params["id"]).catch(() => null);
  if (!doc) {
    res.status(404).json({ error: "Not found" });
    return;
  }
  res.json({
    id: doc._id.toString(),
    word: doc.word,
    reading: doc.reading,
    romaji: doc.romaji ?? undefined,
    meaning: doc.meaning,
    type: doc.type,
    level: doc.level,
    section: doc.section,
    chapter: doc.chapter,
    example_sentences: doc.example_sentences,
    grammar_examples: doc.grammar_examples,
  });
});

// PUT /api/vocab/:id
router.put("/:id", async (req, res) => {
  const parsed = UpdateVocabBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }
  const doc = await Vocab.findByIdAndUpdate(req.params["id"], parsed.data, {
    new: true,
  }).catch(() => null);
  if (!doc) {
    res.status(404).json({ error: "Not found" });
    return;
  }
  res.json({
    id: doc._id.toString(),
    word: doc.word,
    reading: doc.reading,
    romaji: doc.romaji ?? undefined,
    meaning: doc.meaning,
    type: doc.type,
    level: doc.level,
    section: doc.section,
    chapter: doc.chapter,
    example_sentences: doc.example_sentences,
    grammar_examples: doc.grammar_examples,
  });
});

// DELETE /api/vocab/:id
router.delete("/:id", async (req, res) => {
  await Vocab.findByIdAndDelete(req.params["id"]).catch(() => null);
  res.status(204).send();
});

export default router;
