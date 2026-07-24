import { useState, useRef } from "react";
import { Link } from "wouter";
import {
  useCreateVocab, getListVocabQueryKey,
  useCreateKanji, getListKanjiQueryKey,
} from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Plus, Trash2, ArrowLeft, CheckCircle2, Loader2 } from "lucide-react";

// ── Row types ─────────────────────────────────────────────────────────────────

type VocabRow = {
  id: number;
  word: string;
  reading: string;
  meaning: string;
  sentJa: string;   // sample sentence — kana/kanji
  sentEn: string;   // sample sentence — english
};

type KanjiRow = {
  id: number;
  character: string;
  onReading: string;
  kunReading: string;
  meaning: string;
  exWord: string;   // example word — kana/kanji
  exMeaning: string;
};

let rowId = 1;
const mkVocab = (): VocabRow => ({ id: rowId++, word: "", reading: "", meaning: "", sentJa: "", sentEn: "" });
const mkKanji = (): KanjiRow => ({ id: rowId++, character: "", onReading: "", kunReading: "", meaning: "", exWord: "", exMeaning: "" });

// ── Shared context bar ────────────────────────────────────────────────────────

interface ContextBarProps {
  level: "N5" | "N4" | "N3" | "N2" | "N1";
  section: string;
  chapter: string;
  wordType: string;
  showType: boolean;
  onLevel: (v: "N5" | "N4" | "N3" | "N2" | "N1") => void;
  onSection: (v: string) => void;
  onChapter: (v: string) => void;
  onWordType: (v: string) => void;
}

function ContextBar({ level, section, chapter, wordType, showType, onLevel, onSection, onChapter, onWordType }: ContextBarProps) {
  return (
    <Card className="bg-card border-border shadow-sm">
      <CardContent className="p-5">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="space-y-1.5">
            <Label>Level</Label>
            <Select value={level} onValueChange={(v) => onLevel(v as typeof level)}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                {(["N5", "N4", "N3", "N2", "N1"] as const).map((l) => (
                  <SelectItem key={l} value={l}>{l}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5">
            <Label>Section</Label>
            <Input type="number" min={1} value={section} onChange={(e) => onSection(e.target.value)} className="bg-background" />
          </div>
          <div className="space-y-1.5">
            <Label>Chapter</Label>
            <Input type="number" min={1} value={chapter} onChange={(e) => onChapter(e.target.value)} className="bg-background" />
          </div>
          {showType && (
            <div className="space-y-1.5">
              <Label>Word Type</Label>
              <Select value={wordType} onValueChange={onWordType}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="noun">Noun</SelectItem>
                  <SelectItem value="verb">Verb</SelectItem>
                  <SelectItem value="adjective">Adjective</SelectItem>
                  <SelectItem value="adverb">Adverb</SelectItem>
                  <SelectItem value="particle">Particle</SelectItem>
                  <SelectItem value="expression">Expression</SelectItem>
                  <SelectItem value="other">Other</SelectItem>
                </SelectContent>
              </Select>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

// ── Vocab bulk panel ──────────────────────────────────────────────────────────

function VocabBulkPanel({
  level, section, chapter, wordType,
  onLevel, onSection, onChapter, onWordType,
}: Omit<ContextBarProps, "showType">) {
  const [rows, setRows] = useState<VocabRow[]>([mkVocab(), mkVocab(), mkVocab()]);
  const [submitting, setSubmitting] = useState(false);
  const [lastResult, setLastResult] = useState<{ ok: number; fail: number } | null>(null);
  const bottomRef = useRef<HTMLDivElement>(null);

  const { toast } = useToast();
  const queryClient = useQueryClient();
  const createVocab = useCreateVocab();

  const addRow = () => {
    setRows((r) => [...r, mkVocab()]);
    setTimeout(() => bottomRef.current?.scrollIntoView({ behavior: "smooth" }), 50);
  };
  const removeRow = (id: number) => setRows((r) => r.length > 1 ? r.filter((row) => row.id !== id) : r);
  const update = (id: number, field: keyof Omit<VocabRow, "id">, value: string) =>
    setRows((r) => r.map((row) => row.id === id ? { ...row, [field]: value } : row));

  const validRows = rows.filter((r) => r.word.trim() && r.reading.trim() && r.meaning.trim());

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!validRows.length) { toast({ title: "Fill in at least one complete row", variant: "destructive" }); return; }
    setSubmitting(true); setLastResult(null);
    let ok = 0, fail = 0;

    for (const row of validRows) {
      await new Promise<void>((resolve) => {
        createVocab.mutate({
          data: {
            word: row.word.trim(),
            reading: row.reading.trim(),
            meaning: row.meaning.trim(),
            type: wordType,
            level,
            section: Number(section) || 1,
            chapter: Number(chapter) || 1,
            example_sentences: row.sentJa.trim()
              ? [{ japanese: row.sentJa.trim(), romaji: "", english: row.sentEn.trim() }]
              : [],
            grammar_examples: [],
          },
        }, {
          onSuccess: () => { ok++; resolve(); },
          onError:   () => { fail++; resolve(); },
        });
      });
    }

    await queryClient.invalidateQueries({ queryKey: getListVocabQueryKey() });
    setSubmitting(false); setLastResult({ ok, fail });
    if (fail === 0) {
      toast({ title: `✓ Added ${ok} entr${ok === 1 ? "y" : "ies"}` });
      setRows([mkVocab(), mkVocab(), mkVocab()]);
    } else {
      toast({ title: `${ok} added, ${fail} failed`, variant: "destructive" });
    }
  }

  const COLS = "grid-cols-[minmax(7rem,1fr)_minmax(7rem,1fr)_minmax(7rem,1fr)_minmax(9rem,1.3fr)_minmax(9rem,1.3fr)_2rem]";

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      <ContextBar
        level={level} section={section} chapter={chapter} wordType={wordType} showType
        onLevel={onLevel} onSection={onSection} onChapter={onChapter} onWordType={onWordType}
      />

      {/* Table */}
      <div className="overflow-x-auto">
        <div className="min-w-[700px] space-y-2">
          {/* Header */}
          <div className={`grid ${COLS} gap-2 px-1`}>
            {["Word (Kanji/Kana)", "Reading", "Meaning", "Sample Sentence (kana)", "Sample Meaning (EN)", ""].map((h) => (
              <span key={h} className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">{h}</span>
            ))}
          </div>

          {/* Rows */}
          {rows.map((row, i) => (
            <div key={row.id} className={`grid ${COLS} gap-2 items-center`}>
              <Input placeholder="食べる" value={row.word} onChange={(e) => update(row.id, "word", e.target.value)} className="font-serif bg-background" aria-label={`Row ${i+1} word`} />
              <Input placeholder="たべる" value={row.reading} onChange={(e) => update(row.id, "reading", e.target.value)} className="font-serif bg-background" aria-label={`Row ${i+1} reading`} />
              <Input placeholder="to eat" value={row.meaning} onChange={(e) => update(row.id, "meaning", e.target.value)} className="bg-background" aria-label={`Row ${i+1} meaning`} />
              <Input placeholder="毎日ご飯を食べる。" value={row.sentJa} onChange={(e) => update(row.id, "sentJa", e.target.value)} className="font-serif bg-background text-sm" aria-label={`Row ${i+1} sentence kana`} />
              <Input placeholder="I eat rice every day." value={row.sentEn} onChange={(e) => update(row.id, "sentEn", e.target.value)} className="bg-background text-sm" aria-label={`Row ${i+1} sentence english`} />
              <button type="button" onClick={() => removeRow(row.id)} disabled={rows.length === 1} className="w-8 h-8 flex items-center justify-center text-muted-foreground hover:text-destructive transition-colors disabled:opacity-20" aria-label={`Remove row ${i+1}`}>
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            </div>
          ))}
          <div ref={bottomRef} />
        </div>
      </div>

      <SubmitFooter addRow={addRow} validCount={validRows.length} totalCount={rows.length} submitting={submitting} lastResult={lastResult} />
    </form>
  );
}

// ── Kanji bulk panel ──────────────────────────────────────────────────────────

function KanjiBulkPanel({
  level, section, chapter,
  onLevel, onSection, onChapter,
}: Omit<ContextBarProps, "showType" | "wordType" | "onWordType">) {
  const [rows, setRows] = useState<KanjiRow[]>([mkKanji(), mkKanji(), mkKanji()]);
  const [submitting, setSubmitting] = useState(false);
  const [lastResult, setLastResult] = useState<{ ok: number; fail: number } | null>(null);
  const bottomRef = useRef<HTMLDivElement>(null);

  const { toast } = useToast();
  const queryClient = useQueryClient();
  const createKanji = useCreateKanji();

  const addRow = () => {
    setRows((r) => [...r, mkKanji()]);
    setTimeout(() => bottomRef.current?.scrollIntoView({ behavior: "smooth" }), 50);
  };
  const removeRow = (id: number) => setRows((r) => r.length > 1 ? r.filter((row) => row.id !== id) : r);
  const update = (id: number, field: keyof Omit<KanjiRow, "id">, value: string) =>
    setRows((r) => r.map((row) => row.id === id ? { ...row, [field]: value } : row));

  const validRows = rows.filter((r) => r.character.trim() && r.meaning.trim());

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!validRows.length) { toast({ title: "Fill in at least one complete row", variant: "destructive" }); return; }
    setSubmitting(true); setLastResult(null);
    let ok = 0, fail = 0;

    for (const row of validRows) {
      await new Promise<void>((resolve) => {
        createKanji.mutate({
          data: {
            character: row.character.trim(),
            on_readings: row.onReading.trim() ? row.onReading.split(",").map((s) => s.trim()).filter(Boolean) : [],
            kun_readings: row.kunReading.trim() ? row.kunReading.split(",").map((s) => s.trim()).filter(Boolean) : [],
            meanings: row.meaning.split(",").map((s) => s.trim()).filter(Boolean),
            strokes: null,
            level,
            section: Number(section) || 1,
            chapter: Number(chapter) || 1,
            examples: row.exWord.trim()
              ? [{ word: row.exWord.trim(), reading: "", meaning: row.exMeaning.trim() }]
              : [],
          },
        }, {
          onSuccess: () => { ok++; resolve(); },
          onError:   () => { fail++; resolve(); },
        });
      });
    }

    await queryClient.invalidateQueries({ queryKey: getListKanjiQueryKey() });
    setSubmitting(false); setLastResult({ ok, fail });
    if (fail === 0) {
      toast({ title: `✓ Added ${ok} entr${ok === 1 ? "y" : "ies"}` });
      setRows([mkKanji(), mkKanji(), mkKanji()]);
    } else {
      toast({ title: `${ok} added, ${fail} failed`, variant: "destructive" });
    }
  }

  const COLS = "grid-cols-[3rem_minmax(6rem,1fr)_minmax(6rem,1fr)_minmax(7rem,1fr)_minmax(8rem,1.2fr)_minmax(8rem,1.2fr)_2rem]";

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      <ContextBar
        level={level} section={section} chapter={chapter} wordType="" showType={false}
        onLevel={onLevel} onSection={onSection} onChapter={onChapter} onWordType={() => {}}
      />

      <div className="overflow-x-auto">
        <div className="min-w-[780px] space-y-2">
          {/* Header */}
          <div className={`grid ${COLS} gap-2 px-1`}>
            {["Char", "On (音)", "Kun (訓)", "Meaning(s)", "Example Word", "Word Meaning", ""].map((h) => (
              <span key={h} className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">{h}</span>
            ))}
          </div>

          {/* Rows */}
          {rows.map((row, i) => (
            <div key={row.id} className={`grid ${COLS} gap-2 items-center`}>
              <Input placeholder="食" value={row.character} onChange={(e) => update(row.id, "character", e.target.value)} className="font-serif text-xl text-center bg-background" aria-label={`Row ${i+1} character`} />
              <Input placeholder="ショク, ジキ" value={row.onReading} onChange={(e) => update(row.id, "onReading", e.target.value)} className="font-serif bg-background text-sm" aria-label={`Row ${i+1} on reading`} />
              <Input placeholder="た.べる" value={row.kunReading} onChange={(e) => update(row.id, "kunReading", e.target.value)} className="font-serif bg-background text-sm" aria-label={`Row ${i+1} kun reading`} />
              <Input placeholder="food, eat" value={row.meaning} onChange={(e) => update(row.id, "meaning", e.target.value)} className="bg-background text-sm" aria-label={`Row ${i+1} meaning`} />
              <Input placeholder="食べ物" value={row.exWord} onChange={(e) => update(row.id, "exWord", e.target.value)} className="font-serif bg-background text-sm" aria-label={`Row ${i+1} example word`} />
              <Input placeholder="food" value={row.exMeaning} onChange={(e) => update(row.id, "exMeaning", e.target.value)} className="bg-background text-sm" aria-label={`Row ${i+1} example meaning`} />
              <button type="button" onClick={() => removeRow(row.id)} disabled={rows.length === 1} className="w-8 h-8 flex items-center justify-center text-muted-foreground hover:text-destructive transition-colors disabled:opacity-20" aria-label={`Remove row ${i+1}`}>
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            </div>
          ))}
          <div ref={bottomRef} />
        </div>
      </div>

      <SubmitFooter addRow={addRow} validCount={validRows.length} totalCount={rows.length} submitting={submitting} lastResult={lastResult} />
    </form>
  );
}

// ── Shared footer ─────────────────────────────────────────────────────────────

function SubmitFooter({
  addRow, validCount, totalCount, submitting, lastResult,
}: {
  addRow: () => void;
  validCount: number;
  totalCount: number;
  submitting: boolean;
  lastResult: { ok: number; fail: number } | null;
}) {
  return (
    <div className="space-y-4">
      <button type="button" onClick={addRow} className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors px-1">
        <Plus className="w-4 h-4" /> Add another row
      </button>

      {lastResult && lastResult.fail === 0 && (
        <div className="flex items-center gap-2 text-sm text-green-700 bg-green-50 border border-green-200 rounded-md px-4 py-2.5">
          <CheckCircle2 className="w-4 h-4 flex-shrink-0" />
          {lastResult.ok} {lastResult.ok === 1 ? "entry" : "entries"} added successfully.
        </div>
      )}

      <div className="flex items-center justify-between pt-1">
        <span className="text-xs text-muted-foreground">{validCount} of {totalCount} rows ready</span>
        <Button type="submit" disabled={submitting || validCount === 0} className="gap-2 px-8">
          {submitting
            ? <><Loader2 className="w-4 h-4 animate-spin" /> Saving…</>
            : <>Add {validCount > 0 ? validCount : ""} {validCount === 1 ? "Entry" : "Entries"}</>
          }
        </Button>
      </div>
    </div>
  );
}

// ── Page ──────────────────────────────────────────────────────────────────────

export default function BulkAddEntry() {
  const [tab, setTab] = useState<"vocab" | "kanji">("vocab");
  const [level, setLevel] = useState<"N5" | "N4" | "N3" | "N2" | "N1">("N5");
  const [section, setSection] = useState("1");
  const [chapter, setChapter] = useState("1");
  const [wordType, setWordType] = useState("noun");

  const shared = { level, section, chapter, onLevel: setLevel, onSection: setSection, onChapter: setChapter };

  return (
    <div className="space-y-6 animate-in fade-in duration-500 max-w-5xl">
      <header className="space-y-2">
        <div className="flex items-center gap-3">
          <Link href="/add">
            <button className="text-muted-foreground hover:text-foreground transition-colors" aria-label="Back to Add Entry">
              <ArrowLeft className="w-4 h-4" />
            </button>
          </Link>
          <div>
            <h1 className="text-3xl font-serif font-bold text-foreground">Bulk Add</h1>
            <p className="text-muted-foreground text-sm">
              Set level / section / chapter once, then enter multiple words.
            </p>
          </div>
        </div>
      </header>

      <Tabs value={tab} onValueChange={(v) => setTab(v as typeof tab)}>
        <TabsList className="grid w-full max-w-xs grid-cols-2">
          <TabsTrigger value="vocab">Vocabulary</TabsTrigger>
          <TabsTrigger value="kanji">Kanji</TabsTrigger>
        </TabsList>
      </Tabs>

      {tab === "vocab" && (
        <VocabBulkPanel {...shared} wordType={wordType} onWordType={setWordType} />
      )}
      {tab === "kanji" && (
        <KanjiBulkPanel {...shared} />
      )}
    </div>
  );
}
