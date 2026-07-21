import { Router } from "express";
import { Vocab } from "../models/vocab";
import { Kanji } from "../models/kanji";

const router = Router();

router.get("/", async (_req, res, next) => {
  let totalVocab: number,
    totalKanji: number,
    vocabByLevelRaw: { _id: string; count: number }[],
    kanjiByLevelRaw: { _id: string; count: number }[],
    vocabBySectionRaw: { _id: number; count: number }[],
    kanjiBySectionRaw: { _id: number; count: number }[];

  try {
    [
      totalVocab,
      totalKanji,
      vocabByLevelRaw,
      kanjiByLevelRaw,
      vocabBySectionRaw,
      kanjiBySectionRaw,
    ] = await Promise.all([
      Vocab.countDocuments(),
      Kanji.countDocuments(),
      Vocab.aggregate([{ $group: { _id: "$level", count: { $sum: 1 } } }]),
      Kanji.aggregate([{ $group: { _id: "$level", count: { $sum: 1 } } }]),
      Vocab.aggregate([{ $group: { _id: "$section", count: { $sum: 1 } } }]),
      Kanji.aggregate([{ $group: { _id: "$section", count: { $sum: 1 } } }]),
    ]);
  } catch (err) {
    return next(err);
  }

  const toMap = (arr: { _id: string | number; count: number }[]) =>
    Object.fromEntries(arr.map((r) => [String(r._id), r.count]));

  res.json({
    totalVocab,
    totalKanji,
    vocabByLevel: toMap(vocabByLevelRaw as { _id: string; count: number }[]),
    kanjiByLevel: toMap(kanjiByLevelRaw as { _id: string; count: number }[]),
    vocabBySection: toMap(vocabBySectionRaw as { _id: number; count: number }[]),
    kanjiBySection: toMap(kanjiBySectionRaw as { _id: number; count: number }[]),
  });
});

export default router;
