import { useState, useEffect } from "react";
import { useListVocab, getListVocabQueryKey } from "@workspace/api-client-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Zap, X, ChevronLeft, ChevronRight, AlertTriangle } from "lucide-react";
import { cn } from "@/lib/utils";
import type { ListVocabLevel } from "@workspace/api-client-react";
import type { z } from "zod";
import type { ListVocabResponseItem } from "@workspace/api-zod";

type VocabItem = z.infer<typeof ListVocabResponseItem>;

type SetupParams = {
  level?: ListVocabLevel;
  section?: number;
  chapter?: number;
  timePerWord: number;
};

export default function SpeedMemo() {
  const [setup, setSetup] = useState<SetupParams | null>(null);

  if (!setup) return <SetupScreen onStart={setSetup} />;
  return <MemoSession key={JSON.stringify(setup)} setup={setup} onExit={() => setSetup(null)} />;
}

function SetupScreen({ onStart }: { onStart: (p: SetupParams) => void }) {
  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    const level = fd.get("level") as string;
    const section = fd.get("section") as string;
    const chapter = fd.get("chapter") as string;
    onStart({
      level: level !== "all" ? (level as ListVocabLevel) : undefined,
      section: section ? Number(section) : undefined,
      chapter: chapter ? Number(chapter) : undefined,
      timePerWord: Number(fd.get("timePerWord")) || 5,
    });
  };

  return (
    <div className="max-w-2xl mx-auto space-y-8 animate-in fade-in duration-500">
      <header className="space-y-2 text-center">
        <div className="mx-auto w-16 h-16 bg-primary/10 rounded-2xl flex items-center justify-center mb-6">
          <Zap className="w-8 h-8 text-primary" />
        </div>
        <h1 className="text-3xl font-serif font-bold text-foreground">Speed Memo</h1>
        <p className="text-muted-foreground">
          Words cycle automatically — absorb kanji, reading, meaning, and an example at your own pace.
        </p>
      </header>

      <Card className="bg-card border-border shadow-sm p-6">
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
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
            <div className="space-y-2">
              <Label>Time per Word</Label>
              <Select name="timePerWord" defaultValue="5">
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="3">3 seconds</SelectItem>
                  <SelectItem value="5">5 seconds</SelectItem>
                  <SelectItem value="8">8 seconds</SelectItem>
                  <SelectItem value="10">10 seconds</SelectItem>
                  <SelectItem value="15">15 seconds</SelectItem>
                  <SelectItem value="20">20 seconds</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>
                Section{" "}
                <span className="text-muted-foreground text-xs font-normal">(optional)</span>
              </Label>
              <Input name="section" type="number" min={1} placeholder="Any" className="bg-background" />
            </div>
            <div className="space-y-2">
              <Label>
                Chapter{" "}
                <span className="text-muted-foreground text-xs font-normal">(optional)</span>
              </Label>
              <Input name="chapter" type="number" min={1} placeholder="Any" className="bg-background" />
            </div>
          </div>
          <Button type="submit" className="w-full gap-2" size="lg">
            <Zap className="w-4 h-4" /> Start Speed Memo
          </Button>
        </form>
      </Card>
    </div>
  );
}

function MemoSession({ setup, onExit }: { setup: SetupParams; onExit: () => void }) {
  const params = {
    level: setup.level,
    section: setup.section,
    chapter: setup.chapter,
  };

  const { data: words, isLoading, isError } = useListVocab(params, {
    query: { queryKey: getListVocabQueryKey(params) },
  });

  const [currentIdx, setCurrentIdx] = useState(0);
  const [progress, setProgress] = useState(1);

  // Auto-advance timer — resets whenever currentIdx or settings change
  useEffect(() => {
    if (!words || words.length === 0) return;
    setProgress(1);
    const totalMs = setup.timePerWord * 1000;
    const startTime = Date.now();
    const len = words.length;

    const id = setInterval(() => {
      const p = Math.max(0, 1 - (Date.now() - startTime) / totalMs);
      setProgress(p);
      if (p <= 0) {
        clearInterval(id);
        setCurrentIdx((i) => (i + 1) % len);
      }
    }, 50);

    return () => clearInterval(id);
  }, [currentIdx, words?.length, setup.timePerWord]);

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] space-y-4">
        <div className="w-12 h-12 border-4 border-primary/30 border-t-primary rounded-full animate-spin" />
        <p className="text-muted-foreground font-serif animate-pulse">Loading vocabulary...</p>
      </div>
    );
  }

  if (isError || !words || words.length === 0) {
    return (
      <div className="max-w-md mx-auto text-center space-y-6 pt-16 animate-in fade-in duration-500">
        <AlertTriangle className="w-16 h-16 text-destructive mx-auto" />
        <h2 className="text-2xl font-serif font-bold">No words found</h2>
        <p className="text-muted-foreground">No vocabulary matched your filters. Try loosening them.</p>
        <Button onClick={onExit} variant="outline">Change Settings</Button>
      </div>
    );
  }

  const word = words[currentIdx % words.length];
  const example = word.example_sentences?.[0];

  const goNext = () => setCurrentIdx((i) => (i + 1) % words.length);
  const goPrev = () => setCurrentIdx((i) => (i - 1 + words.length) % words.length);

  // Bar colour shifts from primary → amber → red as time runs out
  const barColor =
    progress > 0.5 ? "bg-primary" : progress > 0.25 ? "bg-amber-500" : "bg-destructive";

  return (
    <div className="max-w-2xl mx-auto flex flex-col gap-4 animate-in fade-in duration-300">
      {/* Top bar */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Zap className="w-4 h-4 text-primary" />
          <span className="text-sm font-medium text-muted-foreground">
            {(currentIdx % words.length) + 1} / {words.length}
          </span>
          {setup.level && (
            <Badge variant="outline" className="font-mono text-xs">
              {setup.level}
            </Badge>
          )}
          {setup.section && (
            <span className="text-xs text-muted-foreground">§{setup.section}</span>
          )}
          {setup.chapter && (
            <span className="text-xs text-muted-foreground">Ch.{setup.chapter}</span>
          )}
        </div>
        <Button
          variant="ghost"
          size="icon"
          onClick={onExit}
          className="h-8 w-8 rounded-full text-muted-foreground hover:text-foreground"
          aria-label="Exit"
        >
          <X className="w-4 h-4" />
        </Button>
      </div>

      {/* Card */}
      <Card className="bg-card border-border shadow-sm overflow-hidden">
        {/* Word body */}
        <div className="flex flex-col items-center justify-center text-center px-8 pt-10 pb-6 space-y-2">
          {/* Hiragana reading */}
          <p className="font-serif tracking-[0.25em] text-muted-foreground text-base md:text-lg">
            {word.reading}
          </p>

          {/* Kanji / kana — the star */}
          <h2 className="text-6xl md:text-8xl font-serif font-bold text-foreground leading-none tracking-tight">
            {word.word}
          </h2>

          {/* English meaning */}
          <p className="text-lg md:text-xl text-muted-foreground font-medium pt-1">
            {word.meaning}
          </p>
        </div>

        {/* Example sentence */}
        {example ? (
          <div className="mx-6 md:mx-10 mb-8 border-t border-border/60 pt-5 space-y-1.5 text-center">
            <p className="font-serif text-lg md:text-xl text-foreground leading-relaxed">
              {example.japanese}
            </p>
            <p className="text-sm text-muted-foreground italic">{example.english}</p>
          </div>
        ) : (
          <div className="mb-8" />
        )}

        {/* Section / chapter watermark */}
        <div className="flex justify-center pb-3">
          <span className="text-xs text-muted-foreground/40 tracking-widest">
            §{word.section} · Ch.{word.chapter}
          </span>
        </div>

        {/* Countdown bar */}
        <div className="h-1.5 w-full bg-muted">
          <div
            className={cn("h-full", barColor)}
            style={{ width: `${progress * 100}%` }}
          />
        </div>
      </Card>

      {/* Navigation */}
      <div className="flex items-center justify-center gap-6 py-1">
        <Button
          variant="ghost"
          size="icon"
          onClick={goPrev}
          className="h-10 w-10 rounded-full text-muted-foreground hover:text-foreground"
          aria-label="Previous word"
        >
          <ChevronLeft className="w-5 h-5" />
        </Button>
        <span className="text-xs text-muted-foreground tabular-nums">
          {setup.timePerWord}s per word · loops infinitely
        </span>
        <Button
          variant="ghost"
          size="icon"
          onClick={goNext}
          className="h-10 w-10 rounded-full text-muted-foreground hover:text-foreground"
          aria-label="Next word"
        >
          <ChevronRight className="w-5 h-5" />
        </Button>
      </div>
    </div>
  );
}
