import { useState, useEffect } from "react";
import {
  useListVocab, getListVocabQueryKey,
  useListKanji, getListKanjiQueryKey,
} from "@workspace/api-client-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Zap, X, ChevronLeft, ChevronRight, AlertTriangle } from "lucide-react";
import { cn } from "@/lib/utils";
import type { ListVocabLevel, ListKanjiLevel } from "@workspace/api-client-react";
import type { z } from "zod";
import type { ListVocabResponseItem, ListKanjiResponseItem } from "@workspace/api-zod";

type VocabItem = z.infer<typeof ListVocabResponseItem>;
type KanjiItem = z.infer<typeof ListKanjiResponseItem>;

type ItemType = "vocab" | "kanji";
type FontSize = "small" | "medium" | "large";

type SetupParams = {
  itemType: ItemType;
  level?: string;
  section?: number;
  chapter?: number;
  timePerWord: number;
  fontSize: FontSize;
};

// Normalised shape shared by both vocab and kanji
type CardItem = {
  reading: string;
  word: string;
  meaning: string;
  exampleJa?: string;
  exampleEn?: string;
  section: number;
  chapter: number;
};

// Per-word background palette — cycles by index
const BG_PALETTE: { bg: string; fg: string; sub: string; border: string }[] = [
  { bg: "#F5F0E8", fg: "#1a1510", sub: "#6b5e4e", border: "#d9cfc2" },
  { bg: "#E6EFF2", fg: "#0f1e24", sub: "#4a6872", border: "#c0d5dc" },
  { bg: "#EEE8F5", fg: "#160f20", sub: "#5c4a72", border: "#d4c8e8" },
  { bg: "#E8F2EC", fg: "#0f201a", sub: "#3d6b52", border: "#bddcca" },
  { bg: "#F5EAE8", fg: "#201210", sub: "#704840", border: "#e0c8c4" },
  { bg: "#F2EFE0", fg: "#1e1c0a", sub: "#6b6638", border: "#dcd8b8" },
  { bg: "#E8F0F5", fg: "#0f1a20", sub: "#3a5f72", border: "#bed4e0" },
  { bg: "#F5E8F0", fg: "#200f1a", sub: "#6e3d5c", border: "#e0bdd4" },
];

// Font size scale maps
const FONT = {
  small: {
    reading: "text-xs tracking-widest",
    word: "text-3xl",
    meaning: "text-xs",
    exampleJa: "text-xs",
    exampleEn: "text-xs",
  },
  medium: {
    reading: "text-sm tracking-[0.2em]",
    word: "text-5xl",
    meaning: "text-sm",
    exampleJa: "text-sm",
    exampleEn: "text-xs",
  },
  large: {
    reading: "text-base tracking-[0.15em]",
    word: "text-7xl",
    meaning: "text-base",
    exampleJa: "text-base",
    exampleEn: "text-sm",
  },
} satisfies Record<FontSize, Record<string, string>>;

function normaliseVocab(v: VocabItem): CardItem {
  const ex = v.example_sentences?.[0];
  return {
    reading: v.reading,
    word: v.word,
    meaning: v.meaning,
    exampleJa: ex?.japanese,
    exampleEn: ex?.english,
    section: v.section,
    chapter: v.chapter,
  };
}

function normaliseKanji(k: KanjiItem): CardItem {
  const readings = [
    ...(k.on_readings ?? []),
    ...(k.kun_readings ?? []),
  ].join("　");
  const ex = k.examples?.[0];
  return {
    reading: readings,
    word: k.character,
    meaning: k.meanings.join("、"),
    exampleJa: ex ? `${ex.word}（${ex.reading}）` : undefined,
    exampleEn: ex?.meaning,
    section: k.section,
    chapter: k.chapter,
  };
}

export default function SpeedMemo() {
  const [setup, setSetup] = useState<SetupParams | null>(null);

  if (!setup) return <SetupScreen onStart={setSetup} />;
  return (
    <MemoSession key={JSON.stringify(setup)} setup={setup} onExit={() => setSetup(null)} />
  );
}

// ── Setup screen (renders inside the normal Layout with nav) ──

function SetupScreen({ onStart }: { onStart: (p: SetupParams) => void }) {
  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    const level = fd.get("level") as string;
    const section = fd.get("section") as string;
    const chapter = fd.get("chapter") as string;
    onStart({
      itemType: (fd.get("itemType") as ItemType) || "vocab",
      level: level !== "all" ? level : undefined,
      section: section ? Number(section) : undefined,
      chapter: chapter ? Number(chapter) : undefined,
      timePerWord: Number(fd.get("timePerWord")) || 10,
      fontSize: (fd.get("fontSize") as FontSize) || "medium",
    });
  };

  return (
    <div className="max-w-sm mx-auto space-y-6 animate-in fade-in duration-500">
      <header className="space-y-1 text-center">
        <div className="mx-auto w-14 h-14 bg-primary/10 rounded-2xl flex items-center justify-center mb-4">
          <Zap className="w-7 h-7 text-primary" />
        </div>
        <h1 className="text-2xl font-serif font-bold text-foreground">Speed Memo</h1>
        <p className="text-sm text-muted-foreground">
          Cards cycle automatically — absorb at your own pace.
        </p>
      </header>

      <Card className="bg-card border-border shadow-sm p-5">
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Type */}
          <div className="space-y-1.5">
            <Label>Type</Label>
            <Select name="itemType" defaultValue="vocab">
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="vocab">Vocabulary</SelectItem>
                <SelectItem value="kanji">Kanji</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Level */}
          <div className="space-y-1.5">
            <Label>Level</Label>
            <Select name="level" defaultValue="all">
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Levels</SelectItem>
                <SelectItem value="N5">N5</SelectItem>
                <SelectItem value="N4">N4</SelectItem>
                <SelectItem value="N3">N3</SelectItem>
                <SelectItem value="N2">N2</SelectItem>
                <SelectItem value="N1">N1</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Section + Chapter */}
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label>Section <span className="text-muted-foreground text-xs font-normal">(opt.)</span></Label>
              <Input name="section" type="number" min={1} placeholder="Any" className="bg-background" />
            </div>
            <div className="space-y-1.5">
              <Label>Chapter <span className="text-muted-foreground text-xs font-normal">(opt.)</span></Label>
              <Input name="chapter" type="number" min={1} placeholder="Any" className="bg-background" />
            </div>
          </div>

          {/* Time per word */}
          <div className="space-y-1.5">
            <Label>Time per Word</Label>
            <Select name="timePerWord" defaultValue="10">
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="10">10 seconds</SelectItem>
                <SelectItem value="15">15 seconds</SelectItem>
                <SelectItem value="20">20 seconds</SelectItem>
                <SelectItem value="5">5 seconds</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Font size */}
          <div className="space-y-1.5">
            <Label>Font Size</Label>
            <Select name="fontSize" defaultValue="medium">
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="small">Small</SelectItem>
                <SelectItem value="medium">Medium</SelectItem>
                <SelectItem value="large">Large</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <Button type="submit" className="w-full gap-2" size="lg">
            <Zap className="w-4 h-4" /> Start
          </Button>
        </form>
      </Card>
    </div>
  );
}

// ── Session router — splits on itemType so hooks aren't called conditionally ──

function MemoSession({ setup, onExit }: { setup: SetupParams; onExit: () => void }) {
  if (setup.itemType === "kanji") {
    return <KanjiMemoSession setup={setup} onExit={onExit} />;
  }
  return <VocabMemoSession setup={setup} onExit={onExit} />;
}

function VocabMemoSession({ setup, onExit }: { setup: SetupParams; onExit: () => void }) {
  const params = { level: setup.level as ListVocabLevel | undefined, section: setup.section, chapter: setup.chapter };
  const { data, isLoading, isError } = useListVocab(params, {
    query: { queryKey: getListVocabQueryKey(params) },
  });
  const cards = data?.map(normaliseVocab);
  return <CardSession cards={cards} isLoading={isLoading} isError={isError} setup={setup} onExit={onExit} />;
}

function KanjiMemoSession({ setup, onExit }: { setup: SetupParams; onExit: () => void }) {
  const params = { level: setup.level as ListKanjiLevel | undefined, section: setup.section, chapter: setup.chapter };
  const { data, isLoading, isError } = useListKanji(params, {
    query: { queryKey: getListKanjiQueryKey(params) },
  });
  const cards = data?.map(normaliseKanji);
  return <CardSession cards={cards} isLoading={isLoading} isError={isError} setup={setup} onExit={onExit} />;
}

// ── Card session — fixed overlay covering the entire screen (nav + header hidden) ──

function CardSession({
  cards,
  isLoading,
  isError,
  setup,
  onExit,
}: {
  cards?: CardItem[];
  isLoading: boolean;
  isError: boolean;
  setup: SetupParams;
  onExit: () => void;
}) {
  const [currentIdx, setCurrentIdx] = useState(0);
  const [progress, setProgress] = useState(1);

  const palette = BG_PALETTE[currentIdx % BG_PALETTE.length];
  const f = FONT[setup.fontSize];

  useEffect(() => {
    if (!cards || cards.length === 0) return;
    setProgress(1);
    const totalMs = setup.timePerWord * 1000;
    const startTime = Date.now();
    const len = cards.length;

    const id = setInterval(() => {
      const p = Math.max(0, 1 - (Date.now() - startTime) / totalMs);
      setProgress(p);
      if (p <= 0) {
        clearInterval(id);
        setCurrentIdx((i) => (i + 1) % len);
      }
    }, 50);

    return () => clearInterval(id);
  }, [currentIdx, cards?.length, setup.timePerWord]);

  // Loading state — also as overlay
  if (isLoading) {
    return (
      <div className="fixed inset-0 z-50 flex flex-col items-center justify-center space-y-4"
        style={{ background: BG_PALETTE[0].bg }}>
        <div className="w-10 h-10 border-4 border-black/20 border-t-black/60 rounded-full animate-spin" />
        <p className="text-sm animate-pulse" style={{ color: BG_PALETTE[0].sub }}>Loading...</p>
      </div>
    );
  }

  if (isError || !cards || cards.length === 0) {
    return (
      <div className="fixed inset-0 z-50 flex flex-col items-center justify-center text-center space-y-4 p-6"
        style={{ background: BG_PALETTE[0].bg, color: BG_PALETTE[0].fg }}>
        <AlertTriangle className="w-12 h-12 opacity-60" />
        <h2 className="text-xl font-serif font-bold">No entries found</h2>
        <p className="text-sm opacity-60">No items matched your filters. Try loosening them.</p>
        <button
          onClick={onExit}
          className="mt-2 px-4 py-2 rounded-md border text-sm font-medium"
          style={{ borderColor: BG_PALETTE[0].border, color: BG_PALETTE[0].fg }}>
          Change Settings
        </button>
      </div>
    );
  }

  const card = cards[currentIdx % cards.length];

  // Bar colour: shifts from dark → amber → red as time runs out
  const barOpacity = progress > 0.5 ? 0.5 : progress > 0.25 ? 0.7 : 0.9;
  const barHue = progress > 0.5 ? palette.fg : progress > 0.25 ? "#d97706" : "#dc2626";

  const goNext = () => setCurrentIdx((i) => (i + 1) % cards.length);
  const goPrev = () => setCurrentIdx((i) => (i - 1 + cards.length) % cards.length);

  return (
    <div
      className="fixed inset-0 z-50 flex flex-col transition-colors duration-500"
      style={{ background: palette.bg, color: palette.fg }}
    >
      {/* Top bar */}
      <div className="flex items-center justify-between px-3 py-2 flex-shrink-0" style={{ borderBottom: `1px solid ${palette.border}` }}>
        <div className="flex items-center gap-2">
          <Zap className="w-3 h-3" style={{ color: palette.sub }} />
          <span className="text-xs tabular-nums font-medium" style={{ color: palette.sub }}>
            {(currentIdx % cards.length) + 1} / {cards.length}
          </span>
          {setup.level && (
            <span className="text-xs font-mono px-1.5 py-0.5 rounded" style={{ background: palette.border, color: palette.fg }}>
              {setup.level}
            </span>
          )}
        </div>
        <button
          onClick={onExit}
          className="w-6 h-6 flex items-center justify-center rounded-full opacity-50 hover:opacity-100 transition-opacity"
          aria-label="Exit"
        >
          <X className="w-3.5 h-3.5" />
        </button>
      </div>

      {/* Word body — fills remaining space */}
      <div className="flex-1 flex flex-col items-center justify-center text-center px-5 py-4 space-y-2 min-h-0">
        {/* Reading */}
        <p className={cn("font-serif", f.reading)} style={{ color: palette.sub }}>
          {card.reading}
        </p>

        {/* Main word */}
        <h2 className={cn("font-serif font-bold leading-none tracking-tight", f.word)}>
          {card.word}
        </h2>

        {/* Meaning */}
        <p className={cn("font-medium pt-1", f.meaning)} style={{ color: palette.sub }}>
          {card.meaning}
        </p>

        {/* Example */}
        {card.exampleJa && (
          <div className="pt-3 mt-1 space-y-1 w-full" style={{ borderTop: `1px solid ${palette.border}` }}>
            <p className={cn("font-serif leading-relaxed", f.exampleJa)}>
              {card.exampleJa}
            </p>
            {card.exampleEn && (
              <p className={cn("italic", f.exampleEn)} style={{ color: palette.sub }}>
                {card.exampleEn}
              </p>
            )}
          </div>
        )}
      </div>

      {/* Watermark */}
      <div className="flex justify-center pb-1">
        <span className="text-xs tracking-widest" style={{ color: palette.sub, opacity: 0.4 }}>
          §{card.section} · Ch.{card.chapter}
        </span>
      </div>

      {/* Nav row */}
      <div className="flex items-center justify-center gap-4 py-2 flex-shrink-0">
        <button
          onClick={goPrev}
          className="w-8 h-8 flex items-center justify-center rounded-full opacity-40 hover:opacity-80 transition-opacity"
          aria-label="Previous"
        >
          <ChevronLeft className="w-4 h-4" />
        </button>
        <span className="text-xs tabular-nums opacity-40">
          {setup.timePerWord}s · loops
        </span>
        <button
          onClick={goNext}
          className="w-8 h-8 flex items-center justify-center rounded-full opacity-40 hover:opacity-80 transition-opacity"
          aria-label="Next"
        >
          <ChevronRight className="w-4 h-4" />
        </button>
      </div>

      {/* Countdown bar */}
      <div className="h-1 w-full flex-shrink-0" style={{ background: palette.border }}>
        <div
          className="h-full transition-none"
          style={{ width: `${progress * 100}%`, background: barHue, opacity: barOpacity }}
        />
      </div>
    </div>
  );
}
