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

type SetupParams = {
  itemType: ItemType;
  level?: string;
  section?: number;
  chapter?: number;
  timePerWord: number;
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
    });
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-6">
      <div className="w-full max-w-sm space-y-6 animate-in fade-in duration-500">
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
                <Label>
                  Section{" "}
                  <span className="text-muted-foreground text-xs font-normal">(opt.)</span>
                </Label>
                <Input name="section" type="number" min={1} placeholder="Any" className="bg-background" />
              </div>
              <div className="space-y-1.5">
                <Label>
                  Chapter{" "}
                  <span className="text-muted-foreground text-xs font-normal">(opt.)</span>
                </Label>
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

            <Button type="submit" className="w-full gap-2" size="lg">
              <Zap className="w-4 h-4" /> Start
            </Button>
          </form>
        </Card>
      </div>
    </div>
  );
}

// ── Session router — splits on itemType so hooks are never called conditionally ──

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

// ── Shared card display ──

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

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center space-y-4">
        <div className="w-10 h-10 border-4 border-primary/30 border-t-primary rounded-full animate-spin" />
        <p className="text-muted-foreground font-serif animate-pulse text-sm">Loading...</p>
      </div>
    );
  }

  if (isError || !cards || cards.length === 0) {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center text-center space-y-4 p-6">
        <AlertTriangle className="w-12 h-12 text-destructive" />
        <h2 className="text-xl font-serif font-bold">No entries found</h2>
        <p className="text-sm text-muted-foreground">No items matched your filters. Try loosening them.</p>
        <Button onClick={onExit} variant="outline" size="sm">Change Settings</Button>
      </div>
    );
  }

  const card = cards[currentIdx % cards.length];
  const barColor =
    progress > 0.5 ? "bg-primary" : progress > 0.25 ? "bg-amber-500" : "bg-destructive";

  const goNext = () => setCurrentIdx((i) => (i + 1) % cards.length);
  const goPrev = () => setCurrentIdx((i) => (i - 1 + cards.length) % cards.length);

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Top bar */}
      <div className="flex items-center justify-between px-4 py-3 flex-shrink-0">
        <div className="flex items-center gap-2">
          <Zap className="w-3.5 h-3.5 text-primary" />
          <span className="text-xs font-medium text-muted-foreground tabular-nums">
            {(currentIdx % cards.length) + 1} / {cards.length}
          </span>
          {setup.level && (
            <Badge variant="outline" className="font-mono text-xs py-0 px-1.5">
              {setup.level}
            </Badge>
          )}
        </div>
        <Button
          variant="ghost"
          size="icon"
          onClick={onExit}
          className="h-7 w-7 rounded-full text-muted-foreground hover:text-foreground"
          aria-label="Exit"
        >
          <X className="w-3.5 h-3.5" />
        </Button>
      </div>

      {/* Card — fills remaining space */}
      <div className="flex-1 flex flex-col px-4 pb-2 min-h-0">
        <Card className="bg-card border-border shadow-sm overflow-hidden flex flex-col flex-1">
          {/* Word body */}
          <div className="flex flex-col items-center justify-center text-center px-6 pt-8 pb-4 space-y-1.5 flex-1">
            <p className="font-serif tracking-[0.2em] text-muted-foreground text-sm">
              {card.reading}
            </p>
            <h2 className="text-6xl font-serif font-bold text-foreground leading-none tracking-tight">
              {card.word}
            </h2>
            <p className="text-base text-muted-foreground font-medium pt-1">
              {card.meaning}
            </p>
          </div>

          {/* Example */}
          {card.exampleJa ? (
            <div className="mx-5 mb-6 border-t border-border/60 pt-4 space-y-1 text-center">
              <p className="font-serif text-base text-foreground leading-relaxed">
                {card.exampleJa}
              </p>
              {card.exampleEn && (
                <p className="text-xs text-muted-foreground italic">{card.exampleEn}</p>
              )}
            </div>
          ) : (
            <div className="mb-6" />
          )}

          {/* Watermark */}
          <div className="flex justify-center pb-2">
            <span className="text-xs text-muted-foreground/40 tracking-widest">
              §{card.section} · Ch.{card.chapter}
            </span>
          </div>

          {/* Countdown bar */}
          <div className="h-1.5 w-full bg-muted flex-shrink-0">
            <div
              className={cn("h-full transition-none", barColor)}
              style={{ width: `${progress * 100}%` }}
            />
          </div>
        </Card>
      </div>

      {/* Navigation */}
      <div className="flex items-center justify-center gap-6 py-2 flex-shrink-0">
        <Button
          variant="ghost"
          size="icon"
          onClick={goPrev}
          className="h-9 w-9 rounded-full text-muted-foreground hover:text-foreground"
          aria-label="Previous"
        >
          <ChevronLeft className="w-4 h-4" />
        </Button>
        <span className="text-xs text-muted-foreground tabular-nums">
          {setup.timePerWord}s · loops
        </span>
        <Button
          variant="ghost"
          size="icon"
          onClick={goNext}
          className="h-9 w-9 rounded-full text-muted-foreground hover:text-foreground"
          aria-label="Next"
        >
          <ChevronRight className="w-4 h-4" />
        </Button>
      </div>
    </div>
  );
}
