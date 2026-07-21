import { Router } from "express";
import { Kanji } from "../models/kanji";
import {
  ListKanjiQueryParams,
  CreateKanjiBody,
  UpdateKanjiBody,
} from "@workspace/api-zod";

const router = Router();

function toApi(d: InstanceType<typeof Kanji>) {
  return {
    id: d._id.toString(),
    character: d.character,
    on_readings: d.on_readings,
    kun_readings: d.kun_readings,
    meanings: d.meanings,
    strokes: d.strokes ?? null,
    level: d.level,
    section: d.section,
    chapter: d.chapter,
    examples: d.examples,
  };
}

// GET /api/kanji
router.get("/", async (req, res) => {
  const parsed = ListKanjiQueryParams.safeParse(req.query);
  if (!parsed.success) {
    res.status(400).json({ error: "Invalid query params" });
    return;
  }
  const { section, chapter, level, search } = parsed.data;
  const filter: Record<string, unknown> = {};
  if (section !== undefined) filter["section"] = section;
  if (chapter !== undefined) filter["chapter"] = chapter;
  if (level !== undefined) filter["level"] = level;
  if (search) {
    filter["$or"] = [
      { character: { $regex: search, $options: "i" } },
      { meanings: { $regex: search, $options: "i" } },
      { on_readings: { $regex: search, $options: "i" } },
      { kun_readings: { $regex: search, $options: "i" } },
    ];
  }
  const docs = await Kanji.find(filter).sort({ section: 1, chapter: 1 });
  res.json(docs.map(toApi));
});

// POST /api/kanji
router.post("/", async (req, res) => {
  const parsed = CreateKanjiBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }
  const doc = await Kanji.create(parsed.data);
  res.status(201).json(toApi(doc));
});

// GET /api/kanji/:id
router.get("/:id", async (req, res) => {
  const doc = await Kanji.findById(req.params["id"]).catch(() => null);
  if (!doc) {
    res.status(404).json({ error: "Not found" });
    return;
  }
  res.json(toApi(doc));
});

// PUT /api/kanji/:id
router.put("/:id", async (req, res) => {
  const parsed = UpdateKanjiBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }
  const doc = await Kanji.findByIdAndUpdate(req.params["id"], parsed.data, {
    new: true,
  }).catch(() => null);
  if (!doc) {
    res.status(404).json({ error: "Not found" });
    return;
  }
  res.json(toApi(doc));
});

// DELETE /api/kanji/:id
router.delete("/:id", async (req, res) => {
  await Kanji.findByIdAndDelete(req.params["id"]).catch(() => null);
  res.status(204).send();
});

export default router;
