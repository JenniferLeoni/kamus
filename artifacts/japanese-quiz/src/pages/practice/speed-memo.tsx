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
import { Zap, X, ChevronLeft, ChevronRight, AlertTriangle, Eye, EyeOff } from "lucide-react";
import { cn } from "@/lib/utils";
import type { ListVocabLevel, ListKanjiLevel } from "@workspace/api-client-react";
import type { z } from "zod";
import type { ListVocabResponseItem, ListKanjiResponseItem } from "@workspace/api-zod";

type VocabItem = z.infer<typeof ListVocabResponseItem>;
type KanjiItem = z.infer<typeof ListKanjiResponseItem>;

type ItemType = "vocab" | "kanji";
type FontSize = "small" | "medium" | "large";
type PaletteName =
  | "muted" | "pastel" | "ocean" | "forest" | "sunset"
  | "midnight" | "rose" | "citrus" | "arctic" | "sakura";

type SetupParams = {
  itemType: ItemType;
  level?: string;
  section?: number;
  chapter?: number;
  timePerWord: number;
  fontSize: FontSize;
  palette: PaletteName;
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

// ── Palette definitions ──────────────────────────────────────────────────────
type Swatch = { bg: string; fg: string; sub: string; border: string };

const PALETTES: Record<PaletteName, { label: string; preview: string; swatches: Swatch[] }> = {
  muted: {
    label: "Muted",
    preview: "#E8E2D9",
    swatches: [
      { bg: "#F5F0E8", fg: "#1a1510", sub: "#6b5e4e", border: "#d9cfc2" },
      { bg: "#E6EFF2", fg: "#0f1e24", sub: "#4a6872", border: "#c0d5dc" },
      { bg: "#EEE8F5", fg: "#160f20", sub: "#5c4a72", border: "#d4c8e8" },
      { bg: "#E8F2EC", fg: "#0f201a", sub: "#3d6b52", border: "#bddcca" },
      { bg: "#F5EAE8", fg: "#201210", sub: "#704840", border: "#e0c8c4" },
      { bg: "#F2EFE0", fg: "#1e1c0a", sub: "#6b6638", border: "#dcd8b8" },
      { bg: "#E8F0F5", fg: "#0f1a20", sub: "#3a5f72", border: "#bed4e0" },
      { bg: "#F5E8F0", fg: "#200f1a", sub: "#6e3d5c", border: "#e0bdd4" },
    ],
  },
  pastel: {
    label: "Pastel",
    preview: "#FFD6E0",
    swatches: [
      { bg: "#FFD6E0", fg: "#3d0010", sub: "#a0405a", border: "#ffb3c6" },
      { bg: "#D6F0FF", fg: "#00203d", sub: "#3a7ba0", border: "#a8d8f0" },
      { bg: "#D6FFE4", fg: "#002d12", sub: "#2a8050", border: "#a3f0c0" },
      { bg: "#FFF3D6", fg: "#3d2c00", sub: "#a07a20", border: "#ffe0a0" },
      { bg: "#EDD6FF", fg: "#1e003d", sub: "#7040a0", border: "#d0a8f0" },
      { bg: "#D6FFFD", fg: "#003d3a", sub: "#1a8a80", border: "#a0f0ea" },
      { bg: "#FFD6F8", fg: "#3d0030", sub: "#9a3880", border: "#f0a8e4" },
      { bg: "#FDFFD6", fg: "#303d00", sub: "#7a8a20", border: "#ecf0a0" },
    ],
  },
  ocean: {
    label: "Ocean",
    preview: "#0D4F6C",
    swatches: [
      { bg: "#0D4F6C", fg: "#e8f6fd", sub: "#8ecde8", border: "#1a6e90" },
      { bg: "#0A3D52", fg: "#d6f0ff", sub: "#6bbde0", border: "#155070" },
      { bg: "#083048", fg: "#c8e8f8", sub: "#5aaad0", border: "#104060" },
      { bg: "#12607A", fg: "#f0faff", sub: "#9ad8f0", border: "#1e7a98" },
      { bg: "#0E5268", fg: "#eaf6fc", sub: "#80c8e4", border: "#186080" },
      { bg: "#0B4560", fg: "#ddf0fc", sub: "#72c0e0", border: "#165878" },
      { bg: "#155870", fg: "#f4faff", sub: "#a0d8f0", border: "#207090" },
      { bg: "#0A3C58", fg: "#d8effc", sub: "#60b8dc", border: "#125070" },
    ],
  },
  forest: {
    label: "Forest",
    preview: "#1E4D2B",
    swatches: [
      { bg: "#1E4D2B", fg: "#e8f5ec", sub: "#82c896", border: "#2a6638" },
      { bg: "#163D22", fg: "#d8f0e0", sub: "#6ab880", border: "#1e5230" },
      { bg: "#224E30", fg: "#ecf7ef", sub: "#90ceA0", border: "#2e6840" },
      { bg: "#2A5C38", fg: "#f0f9f2", sub: "#9ad4a8", border: "#387048" },
      { bg: "#183820", fg: "#d0ecda", sub: "#60aa78", border: "#205030" },
      { bg: "#1A4226", fg: "#d8f0e2", sub: "#70bc88", border: "#245835" },
      { bg: "#265830", fg: "#eaf7ed", sub: "#92cea5", border: "#326840" },
      { bg: "#204828", fg: "#e2f3e8", sub: "#7cc492", border: "#2a5e35" },
    ],
  },
  sunset: {
    label: "Sunset",
    preview: "#FF6B35",
    swatches: [
      { bg: "#FF6B35", fg: "#1a0800", sub: "#8a2a00", border: "#ff9060" },
      { bg: "#FF8C42", fg: "#1a0a00", sub: "#904000", border: "#ffac70" },
      { bg: "#FF5E7A", fg: "#200010", sub: "#901840", border: "#ff8da0" },
      { bg: "#FFBC00", fg: "#1a1000", sub: "#906000", border: "#ffd060" },
      { bg: "#FF4E50", fg: "#200000", sub: "#901010", border: "#ff8080" },
      { bg: "#FC913A", fg: "#1a0800", sub: "#903800", border: "#fdb870" },
      { bg: "#FF7043", fg: "#1a0a00", sub: "#8a2800", border: "#ff9870" },
      { bg: "#F9A825", fg: "#1a1200", sub: "#905a00", border: "#ffc960" },
    ],
  },
  midnight: {
    label: "Midnight",
    preview: "#0F0E1A",
    swatches: [
      { bg: "#0F0E1A", fg: "#e8e6ff", sub: "#8880cc", border: "#252040" },
      { bg: "#111428", fg: "#dde8ff", sub: "#7090cc", border: "#1e2848" },
      { bg: "#0E1520", fg: "#d8e8ff", sub: "#6080cc", border: "#182540" },
      { bg: "#150E1A", fg: "#eedeff", sub: "#9070cc", border: "#281840" },
      { bg: "#0A0E18", fg: "#d8e6ff", sub: "#5870cc", border: "#141e38" },
      { bg: "#120E1C", fg: "#e8e2ff", sub: "#8070cc", border: "#201838" },
      { bg: "#0E0E16", fg: "#e2e2ff", sub: "#7878cc", border: "#1c1c34" },
      { bg: "#10121E", fg: "#dae4ff", sub: "#6480cc", border: "#1a2240" },
    ],
  },
  rose: {
    label: "Rose",
    preview: "#E91E8C",
    swatches: [
      { bg: "#E91E8C", fg: "#1a0010", sub: "#880040", border: "#f060b0" },
      { bg: "#C2185B", fg: "#1a0010", sub: "#700030", border: "#e05090" },
      { bg: "#F06292", fg: "#200015", sub: "#903050", border: "#f898b8" },
      { bg: "#E91E63", fg: "#200010", sub: "#900030", border: "#f060a0" },
      { bg: "#AD1457", fg: "#1a0010", sub: "#680028", border: "#d84080" },
      { bg: "#EC407A", fg: "#200010", sub: "#923040", border: "#f880a8" },
      { bg: "#D81B60", fg: "#1a0010", sub: "#820030", border: "#f05090" },
      { bg: "#F48FB1", fg: "#200018", sub: "#904060", border: "#fac0d0" },
    ],
  },
  citrus: {
    label: "Citrus",
    preview: "#F9D423",
    swatches: [
      { bg: "#F9D423", fg: "#1a1400", sub: "#807000", border: "#fce870" },
      { bg: "#F7971E", fg: "#1a0c00", sub: "#905000", border: "#fbc060" },
      { bg: "#CADD3A", fg: "#141a00", sub: "#607800", border: "#e0f070" },
      { bg: "#F2EA00", fg: "#181a00", sub: "#787800", border: "#f8f560" },
      { bg: "#9DC209", fg: "#101800", sub: "#507000", border: "#c8e840" },
      { bg: "#F5A623", fg: "#1a1000", sub: "#906000", border: "#faca70" },
      { bg: "#E8E000", fg: "#181800", sub: "#707000", border: "#f5f050" },
      { bg: "#A8D800", fg: "#101800", sub: "#587000", border: "#d0f040" },
    ],
  },
  arctic: {
    label: "Arctic",
    preview: "#E8F4FD",
    swatches: [
      { bg: "#E8F4FD", fg: "#0a1520", sub: "#4a7090", border: "#c0ddf0" },
      { bg: "#DDEEFF", fg: "#081020", sub: "#3a6080", border: "#b0d0f0" },
      { bg: "#EFF8FF", fg: "#0c1828", sub: "#507898", border: "#c8e4f8" },
      { bg: "#E0EEFA", fg: "#0a1422", sub: "#406888", border: "#b8d4ec" },
      { bg: "#F2F8FF", fg: "#0e1a2a", sub: "#587898", border: "#d0e6f8" },
      { bg: "#D8ECF8", fg: "#081220", sub: "#386078", border: "#a8ccec" },
      { bg: "#E4F2FF", fg: "#0a1624", sub: "#4a7090", border: "#bcd8f4" },
      { bg: "#F5FAFF", fg: "#101c2c", sub: "#5a7a9a", border: "#d4e8fa" },
    ],
  },
  sakura: {
    label: "Sakura",
    preview: "#FFB7C5",
    swatches: [
      { bg: "#FFB7C5", fg: "#200010", sub: "#904060", border: "#ffd0dc" },
      { bg: "#F8C8D4", fg: "#200014", sub: "#904858", border: "#fcdde6" },
      { bg: "#FFCDD8", fg: "#200012", sub: "#985060", border: "#ffe0e8" },
      { bg: "#E8D5E8", fg: "#180018", sub: "#805880", border: "#f0c0f0" },
      { bg: "#F0D8E8", fg: "#1a0014", sub: "#8a5070", border: "#f8c8e0" },
      { bg: "#FAC8D8", fg: "#200012", sub: "#985068", border: "#fddde8" },
      { bg: "#EEC8DC", fg: "#1c0018", sub: "#8a4870", border: "#f8d0e8" },
      { bg: "#F5D0E0", fg: "#200018", sub: "#945068", border: "#fcdde8" },
    ],
  },
};

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

// ── Setup screen ─────────────────────────────────────────────────────────────

function SetupScreen({ onStart }: { onStart: (p: SetupParams) => void }) {
  const [selectedPalette, setSelectedPalette] = useState<PaletteName>("muted");

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
      palette: selectedPalette,
    });
  };

  const paletteNames = Object.keys(PALETTES) as PaletteName[];

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
                <SelectItem value="5">5 seconds</SelectItem>
                <SelectItem value="10">10 seconds</SelectItem>
                <SelectItem value="15">15 seconds</SelectItem>
                <SelectItem value="20">20 seconds</SelectItem>
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

          {/* Colour palette */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label>Colour Palette</Label>
              <span className="text-xs text-muted-foreground">{PALETTES[selectedPalette].label}</span>
            </div>
            <div className="flex flex-wrap gap-2">
              {paletteNames.map((name) => {
                const p = PALETTES[name];
                const isSelected = selectedPalette === name;
                return (
                  <button
                    key={name}
                    type="button"
                    title={p.label}
                    onClick={() => setSelectedPalette(name)}
                    className={cn(
                      "w-8 h-8 rounded-full border-2 transition-transform hover:scale-110",
                      isSelected ? "border-primary scale-110 shadow-md" : "border-transparent"
                    )}
                    style={{ background: p.preview }}
                    aria-label={p.label}
                    aria-pressed={isSelected}
                  />
                );
              })}
            </div>
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

// ── Card session ──────────────────────────────────────────────────────────────

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
  const [showEn, setShowEn] = useState(true);

  const paletteSwatches = PALETTES[setup.palette].swatches;
  const palette = paletteSwatches[currentIdx % paletteSwatches.length];
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

  const firstSwatch = paletteSwatches[0];

  if (isLoading) {
    return (
      <div className="fixed inset-0 z-50 flex flex-col items-center justify-center space-y-4"
        style={{ background: firstSwatch.bg }}>
        <div className="w-10 h-10 border-4 border-black/20 border-t-black/60 rounded-full animate-spin" />
        <p className="text-sm animate-pulse" style={{ color: firstSwatch.sub }}>Loading...</p>
      </div>
    );
  }

  if (isError || !cards || cards.length === 0) {
    return (
      <div className="fixed inset-0 z-50 flex flex-col items-center justify-center text-center space-y-4 p-6"
        style={{ background: firstSwatch.bg, color: firstSwatch.fg }}>
        <AlertTriangle className="w-12 h-12 opacity-60" />
        <h2 className="text-xl font-serif font-bold">No entries found</h2>
        <p className="text-sm opacity-60">No items matched your filters. Try loosening them.</p>
        <button
          onClick={onExit}
          className="mt-2 px-4 py-2 rounded-md border text-sm font-medium"
          style={{ borderColor: firstSwatch.border, color: firstSwatch.fg }}>
          Change Settings
        </button>
      </div>
    );
  }

  const card = cards[currentIdx % cards.length];

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

        <div className="flex items-center gap-2">
          {/* English translation toggle */}
          <button
            onClick={() => setShowEn((v) => !v)}
            className="flex items-center gap-1 px-2 py-0.5 rounded text-xs font-medium transition-opacity"
            style={{
              background: palette.border,
              color: showEn ? palette.fg : palette.sub,
              opacity: showEn ? 1 : 0.5,
            }}
            title={showEn ? "Hide English" : "Show English"}
            aria-label={showEn ? "Hide English" : "Show English"}
          >
            {showEn ? <Eye className="w-3 h-3" /> : <EyeOff className="w-3 h-3" />}
            <span>EN</span>
          </button>

          <button
            onClick={onExit}
            className="w-6 h-6 flex items-center justify-center rounded-full opacity-50 hover:opacity-100 transition-opacity"
            aria-label="Exit"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Word body */}
      <div className="flex-1 flex flex-col items-center justify-center text-center px-5 py-4 space-y-2 min-h-0">
        {/* Reading */}
        <p className={cn("font-serif", f.reading)} style={{ color: palette.sub }}>
          {card.reading}
        </p>

        {/* Main word */}
        <h2 className={cn("font-serif font-bold leading-none tracking-tight", f.word)}>
          {card.word}
        </h2>

        {/* Meaning — hidden when showEn is off */}
        {showEn && (
          <p className={cn("font-medium pt-1", f.meaning)} style={{ color: palette.sub }}>
            {card.meaning}
          </p>
        )}

        {/* Example */}
        {card.exampleJa && (
          <div className="pt-3 mt-1 space-y-1 w-full" style={{ borderTop: `1px solid ${palette.border}` }}>
            <p className={cn("font-serif leading-relaxed", f.exampleJa)}>
              {card.exampleJa}
            </p>
            {showEn && card.exampleEn && (
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
