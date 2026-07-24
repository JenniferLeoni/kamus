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

type CardItem = {
  reading: string;
  word: string;
  meaning: string;
  exampleJa?: string;
  exampleEn?: string;
  section: number;
  chapter: number;
};

// ── Palette definitions ───────────────────────────────────────────────────────
// Each palette has 8 swatches that ALTERNATE dramatically between
// dark and light (or warm/cool) so every card transition is noticeable.
type Swatch = { bg: string; fg: string; sub: string; border: string };

const PALETTES: Record<PaletteName, { label: string; preview: string; swatches: Swatch[] }> = {
  muted: {
    label: "Muted",
    preview: "#C8B89A",
    swatches: [
      { bg: "#F5F0E8", fg: "#1a1208", sub: "#7a6a50", border: "#ddd0bc" }, // cream
      { bg: "#2C2014", fg: "#f0e8d8", sub: "#b09878", border: "#3d301e" }, // dark espresso
      { bg: "#EFF2E6", fg: "#121808", sub: "#5a6840", border: "#cdd8b4" }, // pale sage
      { bg: "#1C2816", fg: "#e4f0d8", sub: "#80a868", border: "#283820" }, // dark forest
      { bg: "#F2EAF5", fg: "#180e20", sub: "#7a5090", border: "#ddc8ec" }, // pale lavender
      { bg: "#221430", fg: "#ede0ff", sub: "#a880d8", border: "#342048" }, // deep indigo
      { bg: "#F8F0DC", fg: "#201800", sub: "#907838", border: "#eaddb0" }, // warm parchment
      { bg: "#1E1C10", fg: "#f5f0e0", sub: "#b0a870", border: "#302e18" }, // dark olive
    ],
  },
  pastel: {
    label: "Pastel",
    preview: "#FFB3C6",
    swatches: [
      { bg: "#FFD6E0", fg: "#3d0010", sub: "#b04060", border: "#ffb3c6" }, // blush pink
      { bg: "#C8E8FF", fg: "#001830", sub: "#2870b0", border: "#a0d0f4" }, // baby blue
      { bg: "#D6FFE4", fg: "#002412", sub: "#288050", border: "#a0f0c0" }, // mint
      { bg: "#FFF8C0", fg: "#2a2000", sub: "#907800", border: "#ffe880" }, // lemon
      { bg: "#EDD6FF", fg: "#1c003d", sub: "#7840b0", border: "#d4a8f8" }, // lavender
      { bg: "#FFE0C8", fg: "#2d1000", sub: "#a05030", border: "#ffcaa0" }, // peach
      { bg: "#C8FEFF", fg: "#002830", sub: "#108898", border: "#90eef8" }, // aqua
      { bg: "#FFD6F8", fg: "#300030", sub: "#a030a0", border: "#f8a8f0" }, // lilac
    ],
  },
  ocean: {
    label: "Ocean",
    preview: "#1A5F7A",
    swatches: [
      { bg: "#082840", fg: "#b8e8ff", sub: "#4898c8", border: "#103850" }, // deep navy
      { bg: "#90E0F8", fg: "#040e18", sub: "#106888", border: "#58c8ec" }, // bright aqua
      { bg: "#0A3050", fg: "#a0d8f8", sub: "#3880b8", border: "#144068" }, // dark teal
      { bg: "#B8F0FF", fg: "#021018", sub: "#207890", border: "#80d8f0" }, // icy cyan
      { bg: "#0E1838", fg: "#c0d8ff", sub: "#5878c0", border: "#182448" }, // midnight blue
      { bg: "#78D8F0", fg: "#020a14", sub: "#0a6080", border: "#40c0e0" }, // seafoam
      { bg: "#061E30", fg: "#b0d8ff", sub: "#3870b0", border: "#0e2e48" }, // abyss
      { bg: "#A0ECF8", fg: "#020c14", sub: "#187090", border: "#68d8ec" }, // light teal
    ],
  },
  forest: {
    label: "Forest",
    preview: "#2D6A4F",
    swatches: [
      { bg: "#0C2818", fg: "#b8ecc8", sub: "#48a868", border: "#183820" }, // dark pine
      { bg: "#A8F0C0", fg: "#020e08", sub: "#187840", border: "#70e0a0" }, // bright mint
      { bg: "#0E3020", fg: "#c0f0d0", sub: "#50b870", border: "#1c4430" }, // deep forest
      { bg: "#C8FFD8", fg: "#040e08", sub: "#208848", border: "#90f0b0" }, // lime green
      { bg: "#122010", fg: "#b0e8c0", sub: "#42a060", border: "#1e3018" }, // midnight green
      { bg: "#90E8A8", fg: "#020c04", sub: "#107030", border: "#58d880" }, // spring green
      { bg: "#081A0C", fg: "#a8e0b8", sub: "#389858", border: "#122810" }, // shadow forest
      { bg: "#B0F8C8", fg: "#040e06", sub: "#188040", border: "#78e8a0" }, // fresh leaf
    ],
  },
  sunset: {
    label: "Sunset",
    preview: "#E85D04",
    swatches: [
      { bg: "#1A0800", fg: "#ffe0b0", sub: "#e08030", border: "#2e1000" }, // dark ember
      { bg: "#FF8C00", fg: "#1a0400", sub: "#7a2800", border: "#e87000" }, // bright amber
      { bg: "#200500", fg: "#ffc8a0", sub: "#d06030", border: "#380800" }, // deep red-orange
      { bg: "#FFD700", fg: "#1a1000", sub: "#806000", border: "#e8c000" }, // golden yellow
      { bg: "#280800", fg: "#ffd0a8", sub: "#c86828", border: "#401200" }, // dark crimson
      { bg: "#FF5722", fg: "#140200", sub: "#601800", border: "#e04010" }, // vivid orange
      { bg: "#1C0A00", fg: "#ffcc88", sub: "#c07020", border: "#301400" }, // burnt umber
      { bg: "#FFA000", fg: "#180800", sub: "#704800", border: "#e08a00" }, // harvest gold
    ],
  },
  midnight: {
    label: "Midnight",
    preview: "#1A1040",
    swatches: [
      { bg: "#080618", fg: "#d0c8ff", sub: "#7868d0", border: "#141028" }, // deep space
      { bg: "#3828A0", fg: "#f0eeff", sub: "#c8b8ff", border: "#4838c0" }, // electric indigo
      { bg: "#040410", fg: "#c0b8f8", sub: "#6860c0", border: "#0c0c20" }, // abyss
      { bg: "#5030C0", fg: "#ffffff", sub: "#d0c0ff", border: "#6040e0" }, // vivid violet
      { bg: "#0A0820", fg: "#d8d0ff", sub: "#8878d8", border: "#161430" }, // void
      { bg: "#2820C8", fg: "#f8f0ff", sub: "#d0b8ff", border: "#3830e8" }, // royal blue
      { bg: "#060414", fg: "#c8c0ff", sub: "#7068c8", border: "#100e24" }, // dark matter
      { bg: "#4028B0", fg: "#fff8ff", sub: "#d8c8ff", border: "#5038d0" }, // cosmic purple
    ],
  },
  rose: {
    label: "Rose",
    preview: "#C9184A",
    swatches: [
      { bg: "#180008", fg: "#ffc8d8", sub: "#d06088", border: "#280010" }, // dark rose
      { bg: "#FF4081", fg: "#140008", sub: "#780030", border: "#e82060" }, // hot pink
      { bg: "#200008", fg: "#ffb0c8", sub: "#c85080", border: "#380010" }, // deep crimson rose
      { bg: "#F8BBD0", fg: "#1a0010", sub: "#a03060", border: "#f090b4" }, // blush
      { bg: "#150005", fg: "#ffa8c0", sub: "#c04070", border: "#250008" }, // black rose
      { bg: "#E91E63", fg: "#ffffff", sub: "#ffc8da", border: "#d81558" }, // vivid rose
      { bg: "#0E0005", fg: "#ff9cb8", sub: "#b83868", border: "#1c0009" }, // shadow
      { bg: "#FCE4EC", fg: "#1a0010", sub: "#9a3050", border: "#f8b8cc" }, // pale blush
    ],
  },
  citrus: {
    label: "Citrus",
    preview: "#E8B800",
    swatches: [
      { bg: "#100E00", fg: "#f8f000", sub: "#a09800", border: "#1e1c00" }, // dark lime
      { bg: "#F9E000", fg: "#141000", sub: "#807800", border: "#e8ca00" }, // bright lemon
      { bg: "#0C1400", fg: "#c8f000", sub: "#708000", border: "#182000" }, // dark lime green
      { bg: "#AAEE00", fg: "#0c0e00", sub: "#507000", border: "#88d800" }, // vivid lime
      { bg: "#160800", fg: "#ffa000", sub: "#905800", border: "#281000" }, // dark citrus
      { bg: "#FF7800", fg: "#140400", sub: "#703000", border: "#e86000" }, // vivid orange
      { bg: "#0A1000", fg: "#d8f800", sub: "#687a00", border: "#141e00" }, // deep olive
      { bg: "#FFD000", fg: "#181000", sub: "#806800", border: "#e8b800" }, // golden citrus
    ],
  },
  arctic: {
    label: "Arctic",
    preview: "#5DA0C8",
    swatches: [
      { bg: "#EAF4FF", fg: "#081828", sub: "#4878a0", border: "#c0dcf0" }, // ice white
      { bg: "#0A3858", fg: "#d0ecff", sub: "#60a8d8", border: "#104870" }, // deep arctic
      { bg: "#F4FAFF", fg: "#0c1e2e", sub: "#507890", border: "#cce4f8" }, // frost
      { bg: "#1A4868", fg: "#c8e8ff", sub: "#70b8e0", border: "#245880" }, // glacier
      { bg: "#FFFFFF", fg: "#081520", sub: "#406880", border: "#d0e8f8" }, // pure white
      { bg: "#083050", fg: "#b8dcff", sub: "#5098c8", border: "#104060" }, // polar night
      { bg: "#E0F0FF", fg: "#0a1c2c", sub: "#3870a0", border: "#b8d8f4" }, // pale sky
      { bg: "#0E2848", fg: "#c0d8f8", sub: "#5890c0", border: "#183858" }, // dark tundra
    ],
  },
  sakura: {
    label: "Sakura",
    preview: "#E8728A",
    swatches: [
      { bg: "#180008", fg: "#ffd8e8", sub: "#d07090", border: "#280010" }, // dark plum
      { bg: "#FFB7C5", fg: "#1a0010", sub: "#a84060", border: "#ff90a8" }, // cherry blossom
      { bg: "#200010", fg: "#ffc0d8", sub: "#c86080", border: "#380018" }, // deep plum
      { bg: "#FDE8F0", fg: "#180010", sub: "#b05070", border: "#f8c8d8" }, // pale sakura
      { bg: "#140008", fg: "#ffb0c8", sub: "#c05878", border: "#240010" }, // shadow plum
      { bg: "#FF8FA3", fg: "#140008", sub: "#700020", border: "#ff6888" }, // vivid cherry
      { bg: "#0E0006", fg: "#ffa8c0", sub: "#b84868", border: "#1c000c" }, // midnight plum
      { bg: "#FAD4E0", fg: "#180010", sub: "#a84868", border: "#f5b8cc" }, // soft petal
    ],
  },
};

// Font size scale maps
const FONT = {
  small:  { reading: "text-xs tracking-widest", word: "text-3xl", meaning: "text-xs", exampleJa: "text-xs", exampleEn: "text-xs" },
  medium: { reading: "text-sm tracking-[0.2em]", word: "text-5xl", meaning: "text-sm", exampleJa: "text-sm", exampleEn: "text-xs" },
  large:  { reading: "text-base tracking-[0.15em]", word: "text-7xl", meaning: "text-base", exampleJa: "text-base", exampleEn: "text-sm" },
} satisfies Record<FontSize, Record<string, string>>;

function normaliseVocab(v: VocabItem): CardItem {
  const ex = v.example_sentences?.[0];
  return { reading: v.reading, word: v.word, meaning: v.meaning, exampleJa: ex?.japanese, exampleEn: ex?.english, section: v.section, chapter: v.chapter };
}

function normaliseKanji(k: KanjiItem): CardItem {
  const readings = [...(k.on_readings ?? []), ...(k.kun_readings ?? [])].join("　");
  const ex = k.examples?.[0];
  return {
    reading: readings, word: k.character, meaning: k.meanings.join("、"),
    exampleJa: ex ? `${ex.word}（${ex.reading}）` : undefined, exampleEn: ex?.meaning,
    section: k.section, chapter: k.chapter,
  };
}

export default function SpeedMemo() {
  const [setup, setSetup] = useState<SetupParams | null>(null);
  if (!setup) return <SetupScreen onStart={setSetup} />;
  return <MemoSession key={JSON.stringify(setup)} setup={setup} onExit={() => setSetup(null)} />;
}

// ── Setup screen ──────────────────────────────────────────────────────────────

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
        <p className="text-sm text-muted-foreground">Cards cycle automatically — absorb at your own pace.</p>
      </header>

      <Card className="bg-card border-border shadow-sm p-5">
        <form onSubmit={handleSubmit} className="space-y-4">
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

          {/* Colour palette picker */}
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

// ── Session router ────────────────────────────────────────────────────────────

function MemoSession({ setup, onExit }: { setup: SetupParams; onExit: () => void }) {
  if (setup.itemType === "kanji") return <KanjiMemoSession setup={setup} onExit={onExit} />;
  return <VocabMemoSession setup={setup} onExit={onExit} />;
}

function VocabMemoSession({ setup, onExit }: { setup: SetupParams; onExit: () => void }) {
  const params = { level: setup.level as ListVocabLevel | undefined, section: setup.section, chapter: setup.chapter };
  const { data, isLoading, isError } = useListVocab(params, { query: { queryKey: getListVocabQueryKey(params) } });
  return <CardSession cards={data?.map(normaliseVocab)} isLoading={isLoading} isError={isError} setup={setup} onExit={onExit} />;
}

function KanjiMemoSession({ setup, onExit }: { setup: SetupParams; onExit: () => void }) {
  const params = { level: setup.level as ListKanjiLevel | undefined, section: setup.section, chapter: setup.chapter };
  const { data, isLoading, isError } = useListKanji(params, { query: { queryKey: getListKanjiQueryKey(params) } });
  return <CardSession cards={data?.map(normaliseKanji)} isLoading={isLoading} isError={isError} setup={setup} onExit={onExit} />;
}

// ── Card session ──────────────────────────────────────────────────────────────

function CardSession({ cards, isLoading, isError, setup, onExit }: {
  cards?: CardItem[]; isLoading: boolean; isError: boolean; setup: SetupParams; onExit: () => void;
}) {
  const [currentIdx, setCurrentIdx] = useState(0);
  const [progress, setProgress] = useState(1);
  const [showEn, setShowEn] = useState(true);

  const swatches = PALETTES[setup.palette].swatches;
  const palette  = swatches[currentIdx % swatches.length];
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
      if (p <= 0) { clearInterval(id); setCurrentIdx((i) => (i + 1) % len); }
    }, 50);
    return () => clearInterval(id);
  }, [currentIdx, cards?.length, setup.timePerWord]);

  const first = swatches[0];

  if (isLoading) {
    return (
      <div className="fixed inset-0 z-50 flex flex-col items-center justify-center space-y-4" style={{ background: first.bg }}>
        <div className="w-10 h-10 border-4 border-black/20 border-t-black/60 rounded-full animate-spin" />
        <p className="text-sm animate-pulse" style={{ color: first.sub }}>Loading...</p>
      </div>
    );
  }

  if (isError || !cards || cards.length === 0) {
    return (
      <div className="fixed inset-0 z-50 flex flex-col items-center justify-center text-center space-y-4 p-6" style={{ background: first.bg, color: first.fg }}>
        <AlertTriangle className="w-12 h-12 opacity-60" />
        <h2 className="text-xl font-serif font-bold">No entries found</h2>
        <p className="text-sm opacity-60">No items matched your filters. Try loosening them.</p>
        <button onClick={onExit} className="mt-2 px-4 py-2 rounded-md border text-sm font-medium" style={{ borderColor: first.border, color: first.fg }}>
          Change Settings
        </button>
      </div>
    );
  }

  const card = cards[currentIdx % cards.length];
  const barHue = progress > 0.5 ? palette.fg : progress > 0.25 ? "#d97706" : "#dc2626";
  const barOpacity = progress > 0.5 ? 0.5 : progress > 0.25 ? 0.7 : 0.9;
  const goNext = () => setCurrentIdx((i) => (i + 1) % cards.length);
  const goPrev = () => setCurrentIdx((i) => (i - 1 + cards.length) % cards.length);

  return (
    <div className="fixed inset-0 z-50 flex flex-col transition-colors duration-500" style={{ background: palette.bg, color: palette.fg }}>
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
          {/* EN toggle */}
          <button
            onClick={() => setShowEn((v) => !v)}
            className="flex items-center gap-1 px-2 py-0.5 rounded text-xs font-medium transition-opacity"
            style={{ background: palette.border, color: showEn ? palette.fg : palette.sub, opacity: showEn ? 1 : 0.5 }}
            title={showEn ? "Hide English" : "Show English"}
          >
            {showEn ? <Eye className="w-3 h-3" /> : <EyeOff className="w-3 h-3" />}
            <span>EN</span>
          </button>
          <button onClick={onExit} className="w-6 h-6 flex items-center justify-center rounded-full opacity-50 hover:opacity-100 transition-opacity" aria-label="Exit">
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Word body */}
      <div className="flex-1 flex flex-col items-center justify-center text-center px-5 py-4 space-y-2 min-h-0">
        <p className={cn("font-serif", f.reading)} style={{ color: palette.sub }}>{card.reading}</p>
        <h2 className={cn("font-serif font-bold leading-none tracking-tight", f.word)}>{card.word}</h2>
        {showEn && (
          <p className={cn("font-medium pt-1", f.meaning)} style={{ color: palette.sub }}>{card.meaning}</p>
        )}
        {card.exampleJa && (
          <div className="pt-3 mt-1 space-y-1 w-full" style={{ borderTop: `1px solid ${palette.border}` }}>
            <p className={cn("font-serif leading-relaxed", f.exampleJa)}>{card.exampleJa}</p>
            {showEn && card.exampleEn && (
              <p className={cn("italic", f.exampleEn)} style={{ color: palette.sub }}>{card.exampleEn}</p>
            )}
          </div>
        )}
      </div>

      {/* Watermark */}
      <div className="flex justify-center pb-1">
        <span className="text-xs tracking-widest" style={{ color: palette.sub, opacity: 0.4 }}>§{card.section} · Ch.{card.chapter}</span>
      </div>

      {/* Nav row */}
      <div className="flex items-center justify-center gap-4 py-2 flex-shrink-0">
        <button onClick={goPrev} className="w-8 h-8 flex items-center justify-center rounded-full opacity-40 hover:opacity-80 transition-opacity" aria-label="Previous">
          <ChevronLeft className="w-4 h-4" />
        </button>
        <span className="text-xs tabular-nums opacity-40">{setup.timePerWord}s · loops</span>
        <button onClick={goNext} className="w-8 h-8 flex items-center justify-center rounded-full opacity-40 hover:opacity-80 transition-opacity" aria-label="Next">
          <ChevronRight className="w-4 h-4" />
        </button>
      </div>

      {/* Countdown bar */}
      <div className="h-1 w-full flex-shrink-0" style={{ background: palette.border }}>
        <div className="h-full transition-none" style={{ width: `${progress * 100}%`, background: barHue, opacity: barOpacity }} />
      </div>
    </div>
  );
}
