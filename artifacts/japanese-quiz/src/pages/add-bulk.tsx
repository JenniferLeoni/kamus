import { useState, useRef } from "react";
import { Link } from "wouter";
import { useCreateVocab, getListVocabQueryKey } from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent } from "@/components/ui/card";
import { Plus, Trash2, ArrowLeft, CheckCircle2, Loader2 } from "lucide-react";

type Row = { id: number; word: string; reading: string; meaning: string };

let rowCounter = 1;
function mkRow(): Row {
  return { id: rowCounter++, word: "", reading: "", meaning: "" };
}

export default function BulkAddEntry() {
  const [level, setLevel] = useState<"N5" | "N4" | "N3" | "N2" | "N1">("N5");
  const [section, setSection] = useState("1");
  const [chapter, setChapter] = useState("1");
  const [wordType, setWordType] = useState("noun");
  const [rows, setRows] = useState<Row[]>([mkRow(), mkRow(), mkRow()]);
  const [submitting, setSubmitting] = useState(false);
  const [lastResult, setLastResult] = useState<{ ok: number; fail: number } | null>(null);

  const { toast } = useToast();
  const queryClient = useQueryClient();
  const createVocab = useCreateVocab();
  const bottomRef = useRef<HTMLDivElement>(null);

  const addRow = () => {
    setRows((r) => [...r, mkRow()]);
    setTimeout(() => bottomRef.current?.scrollIntoView({ behavior: "smooth" }), 50);
  };

  const removeRow = (id: number) =>
    setRows((r) => (r.length > 1 ? r.filter((row) => row.id !== id) : r));

  const update = (id: number, field: keyof Omit<Row, "id">, value: string) =>
    setRows((r) => r.map((row) => (row.id === id ? { ...row, [field]: value } : row)));

  const validRows = rows.filter(
    (r) => r.word.trim() && r.reading.trim() && r.meaning.trim()
  );

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!validRows.length) {
      toast({ title: "Fill in at least one complete row", variant: "destructive" });
      return;
    }
    setSubmitting(true);
    setLastResult(null);

    let ok = 0;
    let fail = 0;

    for (const row of validRows) {
      await new Promise<void>((resolve) => {
        createVocab.mutate(
          {
            data: {
              word: row.word.trim(),
              reading: row.reading.trim(),
              meaning: row.meaning.trim(),
              type: wordType,
              level,
              section: Number(section) || 1,
              chapter: Number(chapter) || 1,
              example_sentences: [],
              grammar_examples: [],
            },
          },
          {
            onSuccess: () => { ok++; resolve(); },
            onError: () => { fail++; resolve(); },
          }
        );
      });
    }

    await queryClient.invalidateQueries({ queryKey: getListVocabQueryKey() });
    setSubmitting(false);
    setLastResult({ ok, fail });

    if (fail === 0) {
      toast({ title: `✓ Added ${ok} entr${ok === 1 ? "y" : "ies"}` });
      setRows([mkRow(), mkRow(), mkRow()]);
    } else {
      toast({
        title: `${ok} added, ${fail} failed`,
        variant: "destructive",
      });
    }
  }

  return (
    <div className="space-y-6 animate-in fade-in duration-500 max-w-3xl">
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

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Shared context */}
        <Card className="bg-card border-border shadow-sm">
          <CardContent className="p-5">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="space-y-1.5">
                <Label>Level</Label>
                <Select value={level} onValueChange={(v) => setLevel(v as typeof level)}>
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
                <Input
                  type="number"
                  min={1}
                  value={section}
                  onChange={(e) => setSection(e.target.value)}
                  className="bg-background"
                />
              </div>
              <div className="space-y-1.5">
                <Label>Chapter</Label>
                <Input
                  type="number"
                  min={1}
                  value={chapter}
                  onChange={(e) => setChapter(e.target.value)}
                  className="bg-background"
                />
              </div>
              <div className="space-y-1.5">
                <Label>Word Type</Label>
                <Select value={wordType} onValueChange={setWordType}>
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
            </div>
          </CardContent>
        </Card>

        {/* Row header */}
        <div className="grid grid-cols-[1fr_1fr_1fr_2rem] gap-2 px-1">
          <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Word (Kanji/Kana)</span>
          <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Reading</span>
          <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">English Meaning</span>
          <span />
        </div>

        {/* Entry rows */}
        <div className="space-y-2">
          {rows.map((row, i) => (
            <div key={row.id} className="grid grid-cols-[1fr_1fr_1fr_2rem] gap-2 items-center">
              <Input
                placeholder={`例. 食べる`}
                value={row.word}
                onChange={(e) => update(row.id, "word", e.target.value)}
                className="font-serif bg-background"
                aria-label={`Row ${i + 1} word`}
              />
              <Input
                placeholder="たべる"
                value={row.reading}
                onChange={(e) => update(row.id, "reading", e.target.value)}
                className="font-serif bg-background"
                aria-label={`Row ${i + 1} reading`}
              />
              <Input
                placeholder="to eat"
                value={row.meaning}
                onChange={(e) => update(row.id, "meaning", e.target.value)}
                className="bg-background"
                aria-label={`Row ${i + 1} meaning`}
              />
              <button
                type="button"
                onClick={() => removeRow(row.id)}
                disabled={rows.length === 1}
                className="w-8 h-8 flex items-center justify-center text-muted-foreground hover:text-destructive transition-colors disabled:opacity-20"
                aria-label={`Remove row ${i + 1}`}
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            </div>
          ))}
          <div ref={bottomRef} />
        </div>

        {/* Add row */}
        <button
          type="button"
          onClick={addRow}
          className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors px-1"
        >
          <Plus className="w-4 h-4" />
          Add another row
        </button>

        {/* Result banner */}
        {lastResult && lastResult.fail === 0 && (
          <div className="flex items-center gap-2 text-sm text-green-700 bg-green-50 border border-green-200 rounded-md px-4 py-2.5">
            <CheckCircle2 className="w-4 h-4 flex-shrink-0" />
            {lastResult.ok} {lastResult.ok === 1 ? "entry" : "entries"} added successfully.
          </div>
        )}

        {/* Submit */}
        <div className="flex items-center justify-between pt-2">
          <span className="text-xs text-muted-foreground">
            {validRows.length} of {rows.length} rows ready
          </span>
          <Button type="submit" disabled={submitting || validRows.length === 0} className="gap-2 px-8">
            {submitting ? (
              <><Loader2 className="w-4 h-4 animate-spin" /> Saving…</>
            ) : (
              <>Add {validRows.length > 0 ? validRows.length : ""} {validRows.length === 1 ? "Entry" : "Entries"}</>
            )}
          </Button>
        </div>
      </form>
    </div>
  );
}
