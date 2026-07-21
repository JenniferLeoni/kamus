import mongoose, { Schema, Document } from "mongoose";

export interface IKanjiExample {
  word: string;
  reading: string;
  meaning: string;
}

export interface IKanji extends Document {
  character: string;
  on_readings: string[];
  kun_readings: string[];
  meanings: string[];
  strokes?: number | null;
  level: "N5" | "N4" | "N3" | "N2" | "N1";
  section: number;
  chapter: number;
  examples: IKanjiExample[];
}

const KanjiExampleSchema = new Schema<IKanjiExample>({
  word: { type: String, required: true },
  reading: { type: String, required: true },
  meaning: { type: String, required: true },
});

const KanjiSchema = new Schema<IKanji>(
  {
    character: { type: String, required: true, unique: true },
    on_readings: { type: [String], default: [] },
    kun_readings: { type: [String], default: [] },
    meanings: { type: [String], required: true },
    strokes: { type: Number, default: null },
    level: {
      type: String,
      required: true,
      enum: ["N5", "N4", "N3", "N2", "N1"],
    },
    section: { type: Number, required: true },
    chapter: { type: Number, required: true },
    examples: { type: [KanjiExampleSchema], default: [] },
  },
  { timestamps: true },
);

KanjiSchema.index({ level: 1, section: 1, chapter: 1 });

export const Kanji = mongoose.model<IKanji>("Kanji", KanjiSchema);
