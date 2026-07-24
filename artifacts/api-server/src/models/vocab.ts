import mongoose, { Schema, Document } from "mongoose";

export interface IExampleSentence {
  japanese: string;
  romaji: string;
  english: string;
}

export interface IGrammarExample {
  grammar: string;
  sentence: string;
  romaji: string;
  english: string;
}

export interface IVocab extends Document {
  word: string;
  reading: string;
  romaji?: string;
  meaning: string;
  type: string;
  level: "N5" | "N4" | "N3" | "N2" | "N1";
  section: number;
  chapter: number;
  example_sentences: IExampleSentence[];
  grammar_examples: IGrammarExample[];
}

const ExampleSentenceSchema = new Schema<IExampleSentence>({
  japanese: { type: String, required: true },
  romaji: { type: String, default: "" },
  english: { type: String, required: true },
});

const GrammarExampleSchema = new Schema<IGrammarExample>({
  grammar: { type: String, required: true },
  sentence: { type: String, required: true },
  romaji: { type: String, required: true },
  english: { type: String, required: true },
});

const VocabSchema = new Schema<IVocab>(
  {
    word: { type: String, required: true },
    reading: { type: String, required: true },
    romaji: { type: String },
    meaning: { type: String, required: true },
    type: { type: String, required: true },
    level: {
      type: String,
      required: true,
      enum: ["N5", "N4", "N3", "N2", "N1"],
    },
    section: { type: Number, required: true },
    chapter: { type: Number, required: true },
    example_sentences: { type: [ExampleSentenceSchema], default: [] },
    grammar_examples: { type: [GrammarExampleSchema], default: [] },
  },
  { timestamps: true },
);

VocabSchema.index({ level: 1, section: 1, chapter: 1 });
VocabSchema.index({ word: "text", meaning: "text" });

export const Vocab = mongoose.model<IVocab>("Vocab", VocabSchema);
